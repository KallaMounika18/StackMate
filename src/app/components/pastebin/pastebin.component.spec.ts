import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PastebinComponent } from './pastebin.component';

describe('PastebinComponent', () => {
  let component: PastebinComponent;
  let fixture: ComponentFixture<PastebinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PastebinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PastebinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
