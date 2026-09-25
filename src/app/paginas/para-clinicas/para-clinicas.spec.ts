import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParaClinicas } from './para-clinicas';

describe('ParaClinicas', () => {
  let component: ParaClinicas;
  let fixture: ComponentFixture<ParaClinicas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParaClinicas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParaClinicas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
