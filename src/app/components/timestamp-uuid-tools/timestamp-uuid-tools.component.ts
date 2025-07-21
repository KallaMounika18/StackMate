// timestamp-uuid-tools.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timestamp-uuid-tools',
  templateUrl: './timestamp-uuid-tools.component.html',
})
export class TimestampUuidToolsComponent {
  activeTab: 'timestamp' | 'uuid' = 'timestamp';
  
  // Timestamp properties
  epochInput: number | null = null;
  dateInput = '';
  epochToDateResult = '';
  dateToEpochResult = '';
  currentDateTime = new Date();
  currentYear = new Date().getFullYear();
  // UUID properties
  uuidCount = 1;
  uuidFormat: 'standard' | 'compact' | 'uppercase' | 'braces' = 'standard';
  generatedUuids: { id: string; timestamp: Date }[] = [];
  uuidToValidate = '';
  uuidValidationResult = { valid: false, version: null };

  timestampPresets = [
    { label: '🕐 Now', action: () => this.setCurrentTime() },
    { label: '📅 Start of Today', action: () => this.setStartOfDay() },
    { label: '🌅 Start of Week', action: () => this.setStartOfWeek() },
    { label: '📆 Start of Month', action: () => this.setStartOfMonth() },
    { label: '🎊 Start of Year', action: () => this.setStartOfYear() }
  ];

  constructor() {
    // Update current time every second
    setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  getCurrentEpoch(): number {
    return Math.floor(this.currentDateTime.getTime() / 1000);
  }

  convertEpochToDate(): void {
    if (this.epochInput === null || this.epochInput === undefined) {
      this.epochToDateResult = '';
      return;
    }

    try {
      const timestamp = this.epochInput * 1000;
      const date = new Date(timestamp);
      this.epochToDateResult = date.toLocaleString();
    } catch (error) {
      this.epochToDateResult = 'Invalid timestamp';
    }
  }

  convertDateToEpoch(): void {
    if (!this.dateInput) {
      this.dateToEpochResult = '';
      return;
    }

    try {
      // Split date and time
      const [datePart, timePart] = this.dateInput.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      // Create date in local time
      const date = new Date(year, month - 1, day, hour, minute, 0);

      this.dateToEpochResult = Math.floor(date.getTime() / 1000).toString();
    } catch (error) {
      this.dateToEpochResult = 'Invalid date';
    }
  }

  setCurrentTime(): void {
    const now = new Date();
    this.epochInput = Math.floor(now.getTime() / 1000);
    this.dateInput = now.toISOString().slice(0, 16);
    this.convertEpochToDate();
    this.convertDateToEpoch();
  }

  setStartOfDay(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.epochInput = Math.floor(today.getTime() / 1000);
    this.convertEpochToDate();
  }

  setStartOfWeek(): void {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    this.epochInput = Math.floor(startOfWeek.getTime() / 1000);
    this.convertEpochToDate();
  }

  setStartOfMonth(): void {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.epochInput = Math.floor(startOfMonth.getTime() / 1000);
    this.convertEpochToDate();
  }

  setStartOfYear(): void {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    this.epochInput = Math.floor(startOfYear.getTime() / 1000);
    this.convertEpochToDate();
  }

  applyTimestampPreset(preset: any): void {
    preset.action();
  }

  copyEpoch(): void {
    if (this.dateToEpochResult) {
      navigator.clipboard.writeText(this.dateToEpochResult);
    }
  }

  copyDate(): void {
    if (this.epochToDateResult) {
      navigator.clipboard.writeText(this.epochToDateResult);
    }
  }

  // UUID Methods
  generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateUuids(): void {
    const count = Math.min(Math.max(this.uuidCount || 1, 1), 100);
    for (let i = 0; i < count; i++) {
      const uuid = this.generateUuid();
      this.generatedUuids.push({
        id: uuid,
        timestamp: new Date()
      });
    }
  }

  formatUuid(uuid: string): string {
    switch (this.uuidFormat) {
      case 'compact':
        return uuid.replace(/-/g, '');
      case 'uppercase':
        return uuid.toUpperCase();
      case 'braces':
        return `{${uuid}}`;
      default:
        return uuid;
    }
  }

  copyUuid(uuid: string): void {
    navigator.clipboard.writeText(uuid);
  }

  copyAllUuids(): void {
    const allUuids = this.generatedUuids
      .map(u => this.formatUuid(u.id))
      .join('\n');
    navigator.clipboard.writeText(allUuids);
  }

  clearUuids(): void {
    this.generatedUuids = [];
  }

  validateUuid(): void {
    if (!this.uuidToValidate) {
      this.uuidValidationResult = { valid: false, version: null };
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const valid = uuidRegex.test(this.uuidToValidate);
    
    let version = null;
    if (valid) {
      version = parseInt(this.uuidToValidate.charAt(14));
    }

    this.uuidValidationResult = { valid, version };
  }

  trackByUuid(index: number, item: { id: string; timestamp: Date }): string {
    return item.id;
  }

}