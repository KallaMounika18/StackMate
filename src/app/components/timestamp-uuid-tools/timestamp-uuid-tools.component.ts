import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-timestamp-uuid-tools',
  templateUrl: './timestamp-uuid-tools.component.html',
  styleUrls: ['./timestamp-uuid-tools.component.scss'],
})
export class TimestampUuidToolsComponent implements OnDestroy {
  activeTab: 'timestamp' | 'uuid' = 'timestamp';

  epochInput: number | null = null;
  dateInput = '';
  epochToDateResult = '';
  dateToEpochResult = '';
  currentDateTime = new Date();
  currentYear = new Date().getFullYear();
  statusMessage = 'Ready';

  uuidCount = 1;
  uuidFormat: 'standard' | 'compact' | 'uppercase' | 'braces' = 'standard';
  generatedUuids: { id: string; timestamp: Date }[] = [];
  uuidToValidate = '';
  uuidValidationResult = { valid: false, version: null as number | null };

  timestampPresets = [
    { label: 'Now', action: () => this.setCurrentTime() },
    { label: 'Start of Today', action: () => this.setStartOfDay() },
    { label: 'Start of Week', action: () => this.setStartOfWeek() },
    { label: 'Start of Month', action: () => this.setStartOfMonth() },
    { label: 'Start of Year', action: () => this.setStartOfYear() }
  ];

  private readonly timerId: number;

  constructor() {
    this.timerId = window.setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timerId);
  }

  getCurrentEpoch(): number {
    return Math.floor(this.currentDateTime.getTime() / 1000);
  }

  getTimezoneName(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getUtcOffset(): string {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    return 'UTC ' + sign + this.pad(hours) + ':' + this.pad(minutes);
  }

  convertEpochToDate(): void {
    if (this.epochInput === null || this.epochInput === undefined) {
      this.epochToDateResult = '';
      return;
    }

    const date = new Date(this.epochInput * 1000);
    this.epochToDateResult = isNaN(date.getTime()) ? 'Invalid timestamp' : date.toLocaleString();
  }

  convertDateToEpoch(): void {
    if (!this.dateInput) {
      this.dateToEpochResult = '';
      return;
    }

    const [datePart, timePart] = this.dateInput.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const date = new Date(year, month - 1, day, hour, minute, 0);
    this.dateToEpochResult = isNaN(date.getTime()) ? 'Invalid date' : Math.floor(date.getTime() / 1000).toString();
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
    this.copyText(this.dateToEpochResult, 'Epoch copied.');
  }

  copyDate(): void {
    this.copyText(this.epochToDateResult, 'Date copied.');
  }

  copyTimezone(): void {
    this.copyText(this.getTimezoneName() + ' • ' + this.getUtcOffset(), 'Timezone copied.');
  }

  generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const r = Math.random() * 16 | 0;
      const value = char === 'x' ? r : (r & 0x3 | 0x8);
      return value.toString(16);
    });
  }

  generateUuids(): void {
    const count = Math.min(Math.max(this.uuidCount || 1, 1), 100);
    for (let index = 0; index < count; index++) {
      this.generatedUuids.unshift({
        id: this.generateUuid(),
        timestamp: new Date()
      });
    }
    this.statusMessage = count + ' UUID' + (count > 1 ? 's generated.' : ' generated.');
  }

  formatUuid(uuid: string): string {
    switch (this.uuidFormat) {
      case 'compact':
        return uuid.replace(/-/g, '');
      case 'uppercase':
        return uuid.toUpperCase();
      case 'braces':
        return '{' + uuid + '}';
      default:
        return uuid;
    }
  }

  copyUuid(uuid: string): void {
    this.copyText(uuid, 'UUID copied.');
  }

  copyAllUuids(): void {
    const allUuids = this.generatedUuids.map((uuid) => this.formatUuid(uuid.id)).join('\n');
    this.copyText(allUuids, 'All UUIDs copied.');
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
    const version = valid ? parseInt(this.uuidToValidate.charAt(14), 10) : null;
    this.uuidValidationResult = { valid, version };
  }

  trackByUuid(index: number, item: { id: string; timestamp: Date }): string {
    return item.id;
  }

  private copyText(value: string, status: string): void {
    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value);
    this.statusMessage = status;
  }

  private pad(value: number): string {
    return value < 10 ? '0' + value : String(value);
  }
}
