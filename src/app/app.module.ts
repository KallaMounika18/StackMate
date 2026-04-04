import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http'; 
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
import { ProfileComponent } from './components/profile/profile.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';

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
    ProfileComponent,
    ChangePasswordComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    RouterModule,
    MarkdownModule.forRoot({ loader: HttpClient })
  ],
  exports: [
    RouterModule,
    ReactiveFormsModule
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
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }