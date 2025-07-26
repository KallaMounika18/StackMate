import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Add this
import { HttpClientModule } from '@angular/common/http'; // <-- Add this
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PastebinComponent } from './components/pastebin/pastebin.component';
import { NotesComponent } from './components/notes/notes.component';
import { RouterModule } from '@angular/router';
import { CodeComparatorComponent } from './components/code-comparator/code-comparator.component';
import { JsonRegexToolsComponent } from './components/json-regex-tools/json-regex-tools.component';
import { TimestampUuidToolsComponent } from './components/timestamp-uuid-tools/timestamp-uuid-tools.component';
import { SharePasteComponent } from './components/share-paste/share-paste.component';

@NgModule({
  declarations: [
    AppComponent,
    PastebinComponent,
    NotesComponent,
    CodeComparatorComponent,
    JsonRegexToolsComponent,
    TimestampUuidToolsComponent,
    SharePasteComponent,

  ],
  imports: [
    BrowserModule,
    FormsModule,        // <-- Add this
    HttpClientModule,   // <-- Add this
    AppRoutingModule,
    RouterModule.forRoot([])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }