import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Add this
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http'; // <-- Add this
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PastebinComponent } from './components/pastebin/pastebin.component';
import { NotesComponent } from './components/notes/notes.component';
import { RouterModule } from '@angular/router';
import { CodeComparatorComponent } from './components/code-comparator/code-comparator.component';
import { JsonRegexToolsComponent } from './components/json-regex-tools/json-regex-tools.component';
import { TimestampUuidToolsComponent } from './components/timestamp-uuid-tools/timestamp-uuid-tools.component';
import { SharePasteComponent } from './components/share-paste/share-paste.component';
import { ApiTesterComponent } from './components/api-tester/api-tester.component';
import { CurlConverterComponent } from './components/curl-converter/curl-converter.component';
import { MarkdownPreviewerComponent } from './components/markdown-previewer/markdown-previewer.component';
import { MarkdownModule } from 'ngx-markdown';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './services/auth.guard';
import { GuestGuard } from './services/guest.guard';
import { AuthInterceptor } from './services/auth.interceptor';
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
    MarkdownPreviewerComponent,
    LoginComponent,
    RegisterComponent,
    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    RouterModule.forRoot([]),
    MarkdownModule.forRoot({ loader: HttpClient })
  ],
  providers: [AuthService,
    AuthGuard,
    GuestGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }