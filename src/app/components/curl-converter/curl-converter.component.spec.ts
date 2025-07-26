import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurlConverterComponent } from './curl-converter.component';

describe('CurlConverterComponent', () => {
  let component: CurlConverterComponent;
  let fixture: ComponentFixture<CurlConverterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurlConverterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurlConverterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create the curl converter component', () => {
    expect(component).toBeTruthy();
  });

  it('should return message for empty input', () => {
    component.curlCommand = '';
    component.convert();
    expect(component.httpRequest).toBe('Please enter a valid cURL command.');
  });

  it('should detect POST request with --data', () => {
    component.curlCommand = `curl -X POST https://example.com --data "name=test"`;
    component.convert();
    expect(component.httpRequest).toBe('POST request detected');
  });

  it('should detect GET request without --data', () => {
    component.curlCommand = `curl https://example.com`;
    component.convert();
    expect(component.httpRequest).toBe('GET request detected');
  });
});
