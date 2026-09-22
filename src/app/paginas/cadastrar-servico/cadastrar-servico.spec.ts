import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastrarServico } from './cadastrar-servico';

describe('CadastrarServico', () => {
  let component: CadastrarServico;
  let fixture: ComponentFixture<CadastrarServico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastrarServico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastrarServico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
