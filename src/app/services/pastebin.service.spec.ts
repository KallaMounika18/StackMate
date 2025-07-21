import { TestBed } from '@angular/core/testing';

import { PastebinService } from './pastebin.service';

describe('PastebinService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PastebinService = TestBed.get(PastebinService);
    expect(service).toBeTruthy();
  });
});
