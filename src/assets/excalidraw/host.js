(function () {
  var React = window.React;
  var ReactDOM = window.ReactDOM;
  var ExcalidrawLib = window.ExcalidrawLib;
  var ROOT_ID = 'stackmate-whiteboard-root';
  var SOURCE_HOST = 'stackmate-whiteboard-host';
  var SOURCE_PARENT = 'stackmate-whiteboard-parent';
  var HISTORY_LIMIT = 100;
  var currentTheme = 'dark';
  var currentBoardName = 'New Board';
  var excalidrawApi = null;
  var setThemeState = null;
  var setBoardNameState = null;
  var readyPosted = false;
  var applyingScene = false;
  var historyCommitTimer = null;
  var currentSceneJson = null;
  var lastCommittedSceneJson = null;
  var undoStack = [];
  var redoStack = [];

  function normalizeTheme(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function getThemeBackground(theme) {
    return normalizeTheme(theme) === 'light' ? '#ffffff' : '#0f172a';
  }

  function applyThemeToDocument(theme) {
    currentTheme = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.style.background = getThemeBackground(currentTheme);
  }

  function createFallbackScene() {
    return {
      type: 'excalidraw',
      version: 2,
      source: 'StackMate Whiteboard',
      elements: [],
      appState: {
        name: currentBoardName,
        theme: currentTheme,
        viewBackgroundColor: getThemeBackground(currentTheme),
        exportBackground: true,
        exportWithDarkMode: currentTheme === 'dark',
        gridSize: null
      },
      files: {}
    };
  }

  function safeParseScene(sceneJson) {
    if (!sceneJson || typeof sceneJson !== 'string') {
      return null;
    }

    try {
      return JSON.parse(sceneJson);
    } catch (error) {
      return null;
    }
  }

  function normalizeScene(sceneJson) {
    var parsedScene = safeParseScene(sceneJson) || {};
    var appState = parsedScene.appState || {};

    return {
      type: parsedScene.type || 'excalidraw',
      version: parsedScene.version || 2,
      source: parsedScene.source || 'StackMate Whiteboard',
      elements: Array.isArray(parsedScene.elements) ? parsedScene.elements : [],
      appState: {
        name: currentBoardName,
        theme: currentTheme,
        viewBackgroundColor: getThemeBackground(currentTheme),
        exportBackground: true,
        exportWithDarkMode: currentTheme === 'dark',
        gridSize: typeof appState.gridSize === 'number' ? appState.gridSize : null
      },
      files: parsedScene.files || {}
    };
  }

  function getSerializableAppState(appState) {
    appState = appState || {};

    return {
      name: currentBoardName,
      theme: currentTheme,
      viewBackgroundColor: getThemeBackground(currentTheme),
      exportBackground: true,
      exportWithDarkMode: currentTheme === 'dark',
      gridSize: typeof appState.gridSize === 'number' ? appState.gridSize : null
    };
  }

  function createSerializedScene(elements, appState, files) {
    if (!ExcalidrawLib || typeof ExcalidrawLib.serializeAsJSON !== 'function') {
      return JSON.stringify(createFallbackScene(), null, 2);
    }

    return ExcalidrawLib.serializeAsJSON(
      elements || [],
      getSerializableAppState(appState),
      files || {},
      'local'
    );
  }

  function buildSnapshotFromScene(elements, appState, files) {
    var sceneJson = createSerializedScene(elements, appState, files);

    return {
      sceneJson: sceneJson,
      elementCount: elements.length,
      isEmpty: elements.length === 0,
      zoom: Math.max(10, Math.round(((appState.zoom && appState.zoom.value) || 1) * 100)),
      activeTool: appState.activeTool && appState.activeTool.type ? appState.activeTool.type : 'selection',
      updatedAt: Date.now()
    };
  }

  function buildSnapshot() {
    if (!excalidrawApi) {
      var fallbackScene = createFallbackScene();
      var fallbackJson = JSON.stringify(fallbackScene, null, 2);

      return {
        sceneJson: fallbackJson,
        elementCount: 0,
        isEmpty: true,
        zoom: 100,
        activeTool: 'selection',
        updatedAt: Date.now()
      };
    }

    return buildSnapshotFromScene(
      excalidrawApi.getSceneElements(),
      excalidrawApi.getAppState(),
      excalidrawApi.getFiles()
    );
  }

  function syncSnapshot() {
    var snapshot = buildSnapshot();
    currentSceneJson = snapshot.sceneJson;
    return snapshot;
  }

  function postMessageToParent(message) {
    window.parent.postMessage(message, window.location.origin);
  }

  function emitReady() {
    if (readyPosted) {
      return;
    }

    readyPosted = true;
    postMessageToParent({
      source: SOURCE_HOST,
      kind: 'event',
      type: 'ready'
    });
  }

  function emitSceneUpdated(snapshot) {
    postMessageToParent({
      source: SOURCE_HOST,
      kind: 'event',
      type: 'scene-updated',
      payload: snapshot
    });
  }

  function respond(requestId, success, payload, error) {
    postMessageToParent({
      source: SOURCE_HOST,
      kind: 'response',
      requestId: requestId,
      success: success,
      payload: payload,
      error: error || null
    });
  }

  function limitStack(stack) {
    while (stack.length > HISTORY_LIMIT) {
      stack.shift();
    }
  }

  function clearHistoryCommitTimer() {
    if (historyCommitTimer !== null) {
      window.clearTimeout(historyCommitTimer);
      historyCommitTimer = null;
    }
  }

  function scheduleHistoryCommit(sceneJson) {
    clearHistoryCommitTimer();
    historyCommitTimer = window.setTimeout(function () {
      commitHistory(sceneJson);
    }, 220);
  }

  function commitHistory(sceneJson) {
    clearHistoryCommitTimer();

    if (applyingScene || !sceneJson || sceneJson === lastCommittedSceneJson) {
      return;
    }

    if (lastCommittedSceneJson) {
      undoStack.push(lastCommittedSceneJson);
      limitStack(undoStack);
    }

    redoStack = [];
    lastCommittedSceneJson = sceneJson;
    currentSceneJson = sceneJson;
  }

  function commitLiveSceneIfNeeded() {
    if (currentSceneJson && currentSceneJson !== lastCommittedSceneJson) {
      commitHistory(currentSceneJson);
    }
  }

  function applyScene(sceneJson, options) {
    options = options || {};
    currentTheme = normalizeTheme(options.theme || currentTheme);
    currentBoardName = options.name || currentBoardName;
    applyThemeToDocument(currentTheme);

    if (setThemeState) {
      setThemeState(currentTheme);
    }

    if (setBoardNameState) {
      setBoardNameState(currentBoardName);
    }

    if (!excalidrawApi) {
      var fallbackSnapshot = syncSnapshot();

      if (options.resetCustomHistory) {
        undoStack = [];
        redoStack = [];
      }

      if (options.rebaseHistory !== false) {
        lastCommittedSceneJson = fallbackSnapshot.sceneJson;
      }

      return Promise.resolve(fallbackSnapshot);
    }

    var scene = normalizeScene(sceneJson);
    applyingScene = true;
    clearHistoryCommitTimer();

    excalidrawApi.updateScene({
      elements: scene.elements,
      appState: scene.appState,
      commitToHistory: false
    });

    if (options.resetNativeHistory && excalidrawApi.history && typeof excalidrawApi.history.clear === 'function') {
      excalidrawApi.history.clear();
    }

    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        applyingScene = false;
        var snapshot = syncSnapshot();

        if (options.resetCustomHistory) {
          undoStack = [];
          redoStack = [];
        }

        if (options.rebaseHistory !== false) {
          lastCommittedSceneJson = snapshot.sceneJson;
        }

        emitSceneUpdated(snapshot);
        resolve(snapshot);
      });
    });
  }

  function performUndo() {
    clearHistoryCommitTimer();

    if (currentSceneJson && currentSceneJson !== lastCommittedSceneJson && lastCommittedSceneJson) {
      redoStack.push(currentSceneJson);
      limitStack(redoStack);
      return applyScene(lastCommittedSceneJson, {
        resetNativeHistory: true,
        rebaseHistory: true
      });
    }

    if (!undoStack.length) {
      return Promise.resolve(syncSnapshot());
    }

    if (currentSceneJson) {
      redoStack.push(currentSceneJson);
      limitStack(redoStack);
    }

    return applyScene(undoStack.pop(), {
      resetNativeHistory: true,
      rebaseHistory: true
    });
  }

  function performRedo() {
    clearHistoryCommitTimer();

    if (!redoStack.length) {
      return Promise.resolve(syncSnapshot());
    }

    if (currentSceneJson) {
      undoStack.push(currentSceneJson);
      limitStack(undoStack);
    }

    return applyScene(redoStack.pop(), {
      resetNativeHistory: true,
      rebaseHistory: true
    });
  }

  function performClearCanvas(theme, name) {
    commitLiveSceneIfNeeded();

    if (currentSceneJson) {
      undoStack.push(currentSceneJson);
      limitStack(undoStack);
    }

    redoStack = [];
    currentTheme = normalizeTheme(theme || currentTheme);
    currentBoardName = name || currentBoardName;

    return applyScene(JSON.stringify(createFallbackScene(), null, 2), {
      theme: currentTheme,
      name: currentBoardName,
      resetNativeHistory: true,
      rebaseHistory: true
    });
  }

  function settleAfterShortcut() {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        var snapshot = syncSnapshot();
        emitSceneUpdated(snapshot);
        resolve(snapshot);
      }, 90);
    });
  }

  function dispatchShortcut(key, code, shiftKey) {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: key,
      code: code,
      ctrlKey: true,
      shiftKey: !!shiftKey,
      bubbles: true,
      cancelable: true
    }));

    return settleAfterShortcut();
  }

  function zoomToFitContent() {
    if (!excalidrawApi) {
      return Promise.resolve(syncSnapshot());
    }

    excalidrawApi.scrollToContent(excalidrawApi.getSceneElements(), {
      fitToContent: true,
      animate: true,
      duration: 120
    });

    return settleAfterShortcut();
  }

  function sanitizeFileName(name) {
    return (name || 'stackmate-whiteboard')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'stackmate-whiteboard';
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onloadend = function () {
        resolve(String(reader.result || ''));
      };

      reader.onerror = function () {
        reject(new Error('PNG export failed while reading the blob'));
      };

      reader.readAsDataURL(blob);
    });
  }

  function exportPng(payload) {
    payload = payload || {};

    if (!excalidrawApi || !ExcalidrawLib || typeof ExcalidrawLib.exportToBlob !== 'function') {
      return Promise.reject(new Error('Whiteboard host is not ready to export'));
    }

    currentTheme = normalizeTheme(payload.theme || currentTheme);
    currentBoardName = payload.fileName || currentBoardName;
    applyThemeToDocument(currentTheme);

    if (setThemeState) {
      setThemeState(currentTheme);
    }

    if (setBoardNameState) {
      setBoardNameState(currentBoardName);
    }

    return ExcalidrawLib.exportToBlob({
      elements: excalidrawApi.getSceneElements(),
      appState: Object.assign(
        {},
        excalidrawApi.getAppState(),
        getSerializableAppState(excalidrawApi.getAppState())
      ),
      files: excalidrawApi.getFiles(),
      mimeType: 'image/png'
    }).then(function (blob) {
      return blobToDataUrl(blob);
    }).then(function (dataUrl) {
      return {
        dataUrl: dataUrl,
        fileName: sanitizeFileName(currentBoardName) + '.png'
      };
    });
  }

  function handleCanvasChange(elements, appState, files) {
    if (applyingScene) {
      return;
    }

    var snapshot = buildSnapshotFromScene(elements, appState, files);
    currentSceneJson = snapshot.sceneJson;
    scheduleHistoryCommit(snapshot.sceneJson);
    emitSceneUpdated(snapshot);
  }

  function handleApiReady(api) {
    excalidrawApi = api;
    currentSceneJson = createSerializedScene(
      api.getSceneElements(),
      api.getAppState(),
      api.getFiles()
    );
    lastCommittedSceneJson = currentSceneJson;
    emitReady();
  }

  function handleRequest(message) {
    var payload = message.payload || {};
    var requestPromise;

    switch (message.type) {
      case 'load-scene':
        requestPromise = applyScene(payload.sceneJson, {
          theme: payload.theme,
          name: payload.name,
          resetNativeHistory: true,
          resetCustomHistory: true,
          rebaseHistory: true
        });
        break;
      case 'set-theme':
        requestPromise = applyScene(currentSceneJson, {
          theme: payload.theme,
          name: currentBoardName,
          rebaseHistory: true
        });
        break;
      case 'set-board-name':
        requestPromise = applyScene(currentSceneJson, {
          theme: currentTheme,
          name: payload.name,
          rebaseHistory: true
        });
        break;
      case 'set-active-tool':
        requestPromise = (function () {
          if (!excalidrawApi) {
            return Promise.resolve(syncSnapshot());
          }

          excalidrawApi.setActiveTool({
            type: payload.tool,
            locked: false
          });

          return settleAfterShortcut();
        }());
        break;
      case 'undo':
        requestPromise = performUndo();
        break;
      case 'redo':
        requestPromise = performRedo();
        break;
      case 'zoom-in':
        requestPromise = dispatchShortcut('=', 'Equal', false);
        break;
      case 'zoom-out':
        requestPromise = dispatchShortcut('-', 'Minus', false);
        break;
      case 'zoom-to-fit':
        requestPromise = zoomToFitContent();
        break;
      case 'clear-canvas':
        requestPromise = performClearCanvas(payload.theme, payload.name);
        break;
      case 'get-scene':
        requestPromise = Promise.resolve(syncSnapshot());
        break;
      case 'export-png':
        requestPromise = exportPng(payload);
        break;
      default:
        requestPromise = Promise.reject(new Error('Unknown whiteboard host request: ' + message.type));
    }

    Promise.resolve(requestPromise)
      .then(function (result) {
        respond(message.requestId, true, result);
      })
      .catch(function (error) {
        respond(
          message.requestId,
          false,
          null,
          error && error.message ? error.message : 'Whiteboard host failed'
        );
      });
  }

  function HostApp() {
    var themeState = React.useState(currentTheme);
    var boardNameState = React.useState(currentBoardName);
    var theme = themeState[0];
    var setTheme = themeState[1];
    var boardName = boardNameState[0];
    var setBoardName = boardNameState[1];

    React.useEffect(function () {
      setThemeState = setTheme;
      setBoardNameState = setBoardName;
      currentTheme = theme;
      currentBoardName = boardName;
      applyThemeToDocument(theme);
    }, [theme, boardName]);

    React.useEffect(function () {
      return function () {
        setThemeState = null;
        setBoardNameState = null;
        excalidrawApi = null;
      };
    }, []);

    return React.createElement(
      'div',
      { className: 'stackmate-host' },
      React.createElement(ExcalidrawLib.Excalidraw, {
        excalidrawAPI: handleApiReady,
        onChange: handleCanvasChange,
        initialData: createFallbackScene(),
        theme: theme,
        name: boardName,
        handleKeyboardGlobally: true,
        UIOptions: {
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            toggleTheme: false
          },
          tools: {
            image: false
          },
          welcomeScreen: false
        },
        renderTopRightUI: function () {
          return null;
        }
      })
    );
  }

  if (!React || !ReactDOM || !ExcalidrawLib) {
    document.getElementById(ROOT_ID).textContent = 'Failed to load the Excalidraw host assets.';
    return;
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || event.origin !== window.location.origin) {
      return;
    }

    var data = event.data || {};

    if (data.source !== SOURCE_PARENT || data.kind !== 'request') {
      return;
    }

    handleRequest(data);
  });

  applyThemeToDocument(currentTheme);
  currentSceneJson = JSON.stringify(createFallbackScene(), null, 2);
  lastCommittedSceneJson = currentSceneJson;

  var rootNode = document.getElementById(ROOT_ID);

  if (ReactDOM.createRoot) {
    ReactDOM.createRoot(rootNode).render(React.createElement(HostApp));
  } else {
    ReactDOM.render(React.createElement(HostApp), rootNode);
  }
}());
