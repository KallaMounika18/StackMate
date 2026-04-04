import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.scss']
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() title = '';
  @Input() icon = '';
  @Input() block = false;
  @Input() small = false;
  @Output() pressed = new EventEmitter<Event>();

  handleClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.pressed.emit(event);
  }
}
