import { Component } from '@angular/core';
import * as Diff from 'diff';

@Component({
  selector: 'app-code-comparator',
  templateUrl: './code-comparator.component.html',
  styleUrls: ['./code-comparator.component.scss'],
})
export class CodeComparatorComponent {
  leftCode: string = '';
  rightCode: string = '';
  leftDiffHtml: string = '';
  rightDiffHtml: string = '';
  showResults: boolean = false;
  hideUnchanged: boolean = false;

  leftLineCount: number = 0;
  rightLineCount: number = 0;
  diffCount: number = 0;

  get canCompare(): boolean {
    return this.leftCode.trim() !== '' && this.rightCode.trim() !== '';
  }

  get hasAnyCode(): boolean {
    return this.leftCode.trim() !== '' || this.rightCode.trim() !== '';
  }

  onCodeChange() {
    this.leftLineCount = this.leftCode.split('\n').length;
    this.rightLineCount = this.rightCode.split('\n').length;
  }

  compareCode() {
    const leftLines = this.leftCode.split('\n');
    const rightLines = this.rightCode.split('\n');
    const diff = Diff.diffLines(this.leftCode, this.rightCode);

    let leftHtml = '';
    let rightHtml = '';
    let diffs = 0;

    diff.forEach((part) => {
      const escaped = part.value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (part.added) {
        rightHtml += `<div style="background-color:#d4edda;">+ ${escaped}</div>`;
        diffs++;
      } else if (part.removed) {
        leftHtml += `<div style="background-color:#f8d7da;">- ${escaped}</div>`;
        diffs++;
      } else {
        if (!this.hideUnchanged) {
          const lines = escaped.split('\n');
          lines.forEach((line) => {
            leftHtml += `<div>${line}</div>`;
            rightHtml += `<div>${line}</div>`;
          });
        }
      }
    });

    this.diffCount = diffs;
    this.leftDiffHtml = leftHtml;
    this.rightDiffHtml = rightHtml;
    this.showResults = true;
  }

  clearAll() {
    this.leftCode = '';
    this.rightCode = '';
    this.leftDiffHtml = '';
    this.rightDiffHtml = '';
    this.showResults = false;
    this.diffCount = 0;
    this.leftLineCount = 0;
    this.rightLineCount = 0;
  }

  swapCode() {
    [this.leftCode, this.rightCode] = [this.rightCode, this.leftCode];
    this.onCodeChange();
    this.showResults = false;
  }

  toggleCollapse() {
    this.hideUnchanged = !this.hideUnchanged;
    this.compareCode();
  }
}
