import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComoFunciona } from './como-funciona';

describe('ComoFunciona', () => {
  let component: ComoFunciona;
  let fixture: ComponentFixture<ComoFunciona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComoFunciona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComoFunciona);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
