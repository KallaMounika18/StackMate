import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { diffLines } from 'diff';

@Component({
  selector: 'app-code-comparator',
  templateUrl: './code-comparator.component.html',
  styleUrls: ['./code-comparator.component.scss']
})
export class CodeComparatorComponent implements AfterViewInit {
  leftCode: string = '';
  rightCode: string = '';
  leftDiffHtml: string = '';
  rightDiffHtml: string = '';
  showResults: boolean = false;
  diffCount: number = 0;
  leftLineCount: number = 0;
  rightLineCount: number = 0;
  hideUnchanged: boolean = false;
  isFullscreen: boolean = false;
  
  @ViewChild('container', { static: false }) containerRef: ElementRef | undefined;
  
  ngAfterViewInit(): void {
    this.setupResizeHandles();
    this.setupTabHandling();
  }

  setupResizeHandles() {
    setTimeout(() => {
      const resizeHandles = document.querySelectorAll('.resize-handle');
      const codePanels = document.querySelectorAll('.code-panel');
      
      resizeHandles.forEach((handle: HTMLElement, index) => {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        handle.addEventListener('mousedown', (e) => {
          isResizing = true;
          startY = e.clientY;
          startHeight = codePanels[index].clientHeight;
          document.body.style.cursor = 'ns-resize';
          e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          const newHeight = startHeight + (e.clientY - startY);
          if (newHeight > 100) { // Minimum height
            (codePanels[index] as HTMLElement).style.height = `${newHeight}px`;
          }
        });
        
        document.addEventListener('mouseup', () => {
          isResizing = false;
          document.body.style.cursor = 'default';
        });
      });
    }, 100);
  }
  
  setupTabHandling() {
    setTimeout(() => {
      const textareas = document.querySelectorAll('.code-textarea');
      
      textareas.forEach((textarea: HTMLTextAreaElement) => {
        textarea.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Set textarea value to: text before caret + tab + text after caret
            textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            
            // Put caret at right position again
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }
        });
      });
    }, 100);
  }
  
  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    
    const container = document.querySelector('.container') as HTMLElement;
    if (this.isFullscreen) {
      container.classList.add('fullscreen');
      document.body.style.overflow = 'hidden';
    } else {
      container.classList.remove('fullscreen');
      document.body.style.overflow = 'auto';
    }
  }
  
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isFullscreen) {
      this.toggleFullscreen();
    }
  }
  
  compareCode() {
    const diffs = diffLines(this.leftCode, this.rightCode);
    let leftHtml = '';
    let rightHtml = '';
    let count = 0;

    diffs.forEach(part => {
      const escapedValue = part.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (part.added) {
        count++;
        rightHtml += `<div class="line line-added">+ ${escapedValue}</div>`;
      } else if (part.removed) {
        count++;
        leftHtml += `<div class="line line-removed">- ${escapedValue}</div>`;
      } else {
        const line = `<div class="line">${escapedValue}</div>`;
        if (!this.hideUnchanged) {
          leftHtml += line;
          rightHtml += line;
        }
      }
    });

    this.leftDiffHtml = leftHtml;
    this.rightDiffHtml = rightHtml;
    this.showResults = true;
    this.diffCount = count;
    this.leftLineCount = this.leftCode.split('\n').length;
    this.rightLineCount = this.rightCode.split('\n').length;
  }

  toggleCollapse() {
    this.hideUnchanged = !this.hideUnchanged;
    this.compareCode(); // re-render with toggle applied
  }

  clearAll() {
    this.leftCode = '';
    this.rightCode = '';
    this.leftDiffHtml = '';
    this.rightDiffHtml = '';
    this.diffCount = 0;
    this.showResults = false;
  }

  swapCode() {
    [this.leftCode, this.rightCode] = [this.rightCode, this.leftCode];
    this.compareCode();
  }

  get canCompare(): boolean {
    return this.leftCode.trim().length > 0 && this.rightCode.trim().length > 0;
  }

  get hasAnyCode(): boolean {
    return this.leftCode.trim().length > 0 || this.rightCode.trim().length > 0;
  }
  
  // Helper method to copy text to clipboard
  copyToClipboard(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
