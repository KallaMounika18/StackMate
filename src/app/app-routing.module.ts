import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PastebinComponent } from './components/pastebin/pastebin.component';
import { NotesComponent } from './components/notes/notes.component';
import { CodeComparatorComponent } from './components/code-comparator/code-comparator.component';
import { TimestampUuidToolsComponent } from './components/timestamp-uuid-tools/timestamp-uuid-tools.component';
import { JsonRegexToolsComponent } from './components/json-regex-tools/json-regex-tools.component';

const routes: Routes = [
  { path: 'pastebin', component: PastebinComponent },
  { path: 'notes', component: NotesComponent },
  { path: 'code-comparator', component: CodeComparatorComponent },
  { path: 'timestamp-uuid-tools', component: TimestampUuidToolsComponent },
  { path: 'json-regex-tools', component: JsonRegexToolsComponent },
  { path: '', redirectTo: '/pastebin', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }