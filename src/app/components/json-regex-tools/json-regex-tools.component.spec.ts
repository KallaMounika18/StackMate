import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonRegexToolsComponent } from './json-regex-tools.component';

describe('JsonRegexToolsComponent', () => {
  let component: JsonRegexToolsComponent;
  let fixture: ComponentFixture<JsonRegexToolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JsonRegexToolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JsonRegexToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
