import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampUuidToolsComponent } from './timestamp-uuid-tools.component';

describe('TimestampUuidToolsComponent', () => {
  let component: TimestampUuidToolsComponent;
  let fixture: ComponentFixture<TimestampUuidToolsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimestampUuidToolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimestampUuidToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
