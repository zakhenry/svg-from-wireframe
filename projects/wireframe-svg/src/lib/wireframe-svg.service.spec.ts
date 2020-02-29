import { TestBed } from '@angular/core/testing';

import { WireframeSvgService } from './wireframe-svg.service';

describe('WireframeSvgService', () => {
  let service: WireframeSvgService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WireframeSvgService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
