import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeComparatorComponent } from './code-comparator.component';

describe('CodeComparatorComponent', () => {
  let component: CodeComparatorComponent;
  let fixture: ComponentFixture<CodeComparatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CodeComparatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeComparatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
