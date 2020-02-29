import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WireframeSvgComponent } from './wireframe-svg.component';

describe('WireframeSvgComponent', () => {
  let component: WireframeSvgComponent;
  let fixture: ComponentFixture<WireframeSvgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WireframeSvgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WireframeSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
