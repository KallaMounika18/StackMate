import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorComponent } from './monaco-editor/monaco-editor.component';
import { UiButtonComponent } from './ui-button/ui-button.component';
import { UiCardComponent } from './ui-card/ui-card.component';
import { UiInputComponent } from './ui-input/ui-input.component';

@NgModule({
  declarations: [
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    MonacoEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    MonacoEditorComponent
  ]
})
export class SharedModule { }
