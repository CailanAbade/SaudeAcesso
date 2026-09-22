import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarServico } from './editar-servico';

describe('EditarServico', () => {
  let component: EditarServico;
  let fixture: ComponentFixture<EditarServico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarServico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarServico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
