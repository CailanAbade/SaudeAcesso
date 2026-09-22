import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clinica } from './clinica';

describe('Clinica', () => {
  let component: Clinica;
  let fixture: ComponentFixture<Clinica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clinica]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Clinica);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
