import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelClinica } from './painel-clinica';

describe('PainelClinica', () => {
  let component: PainelClinica;
  let fixture: ComponentFixture<PainelClinica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelClinica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelClinica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
