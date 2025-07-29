import { TestBed } from '@angular/core/testing';

import { SavedApiService } from './saved-api.service';

describe('SavedApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SavedApiService = TestBed.get(SavedApiService);
    expect(service).toBeTruthy();
  });
});
