import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PastebinComponent } from './components/pastebin/pastebin.component';
import { NotesComponent } from './components/notes/notes.component';
import { CodeComparatorComponent } from './components/code-comparator/code-comparator.component';
import { JsonRegexToolsComponent } from './components/json-regex-tools/json-regex-tools.component';
import { TimestampUuidToolsComponent } from './components/timestamp-uuid-tools/timestamp-uuid-tools.component';
import { SharePasteComponent } from './components/share-paste/share-paste.component';
import { ApiTesterComponent } from './components/api-tester/api-tester.component';
import { CurlConverterComponent } from './components/curl-converter/curl-converter.component';
import { MarkdownPreviewerComponent } from './components/markdown-previewer/markdown-previewer.component';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule } from './shared/shared.module';
@NgModule({
  declarations: [
    AppComponent,
    PastebinComponent,
    NotesComponent,
    CodeComparatorComponent,
    JsonRegexToolsComponent,
    TimestampUuidToolsComponent,
    SharePasteComponent,
    ApiTesterComponent,
    CurlConverterComponent,
    MarkdownPreviewerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SharedModule,
    MarkdownModule.forRoot({ loader: HttpClient })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
