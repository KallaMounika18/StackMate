import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PastebinComponent } from './components/pastebin/pastebin.component';
import { NotesComponent } from './components/notes/notes.component';
import { CodeComparatorComponent } from './components/code-comparator/code-comparator.component';
import { TimestampUuidToolsComponent } from './components/timestamp-uuid-tools/timestamp-uuid-tools.component';
import { JsonRegexToolsComponent } from './components/json-regex-tools/json-regex-tools.component';
import { SharePasteComponent } from './components/share-paste/share-paste.component';
import { ApiTesterComponent } from './components/api-tester/api-tester.component';
import { CurlConverterComponent } from './components/curl-converter/curl-converter.component';
import { MarkdownPreviewerComponent } from './components/markdown-previewer/markdown-previewer.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GuestGuard } from './services/guest.guard';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: 'tools',
    // canActivate: [AuthGuard],
    children: [
      { path: 'pastebin', component: PastebinComponent },
      { path: 'notes', component: NotesComponent },
      { path: 'code-comparator', component: CodeComparatorComponent },
      { path: 'timestamp-uuid-tools', component: TimestampUuidToolsComponent },
      { path: 'json-regex-tools', component: JsonRegexToolsComponent },
      { path: '', redirectTo: '/pastebin', pathMatch: 'full' },
      { path: 'share/:id', component: SharePasteComponent },
      { path: 'api-tester', component: ApiTesterComponent },
      { path: 'curl-converter', component: CurlConverterComponent },
      { path: 'markdown-previewer', component: MarkdownPreviewerComponent },
    ]
  },
  { 
    path: '', 
    component: LoginComponent,
    pathMatch: 'full' 
  },

  // Auth routes (accessible only to guests)
  { 
    path: 'login', 
    component: LoginComponent,
    // canActivate: [AuthGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    // canActivate: [AuthGuard]
  },
  // { 
  //   path: '**', 
  //   redirectTo: '/404' 
  // }


  // Protected routes (require authentication)
  // { 
  //   path: 'dashboard', 
  //   component: DashboardComponent,
  //   canActivate: [AuthGuard]
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }