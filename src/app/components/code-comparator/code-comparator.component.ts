import { Component } from '@angular/core';
import { diffLines } from 'diff';

@Component({
  selector: 'app-code-comparator',
  templateUrl: './code-comparator.component.html',
  styleUrls: ['./code-comparator.component.scss']
})
export class CodeComparatorComponent {
  leftCode: string = '';
  rightCode: string = '';
  leftDiffHtml: string = '';
  rightDiffHtml: string = '';
  showResults: boolean = false;
  diffCount: number = 0;
  leftLineCount: number = 0;
  rightLineCount: number = 0;
  hideUnchanged: boolean = false;

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
}
