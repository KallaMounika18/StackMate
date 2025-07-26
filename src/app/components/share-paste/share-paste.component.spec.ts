import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharePasteComponent } from './share-paste.component';

describe('SharePasteComponent', () => {
  let component: SharePasteComponent;
  let fixture: ComponentFixture<SharePasteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SharePasteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharePasteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
