import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { combineLatest } from 'rxjs';

import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';
import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

import {
  Clinica as ClinicaModel,
} from '../../nucleo/modelos/clinica.model';

import { Medico } from '../../nucleo/modelos/medico.model';
import { Servico } from '../../nucleo/modelos/servico.model';

import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';

@Component({
  selector: 'app-clinica',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
  ],
  templateUrl: './clinica.html',
  styleUrl: './clinica.css',
})
export class ClinicaComponent {
  private rota = inject(
    ActivatedRoute
  );

  private catalogo = inject(
    Catalogo
  );

  protected preco = inject(
    Preco
  );

  clinica =
    signal<ClinicaModel | null>(
      null
    );

  servicos =
    signal<Servico[]>([]);

  medicos =
    signal<Medico[]>([]);

  carregando =
    signal(true);

  naoEncontrada =
    signal(false);

  constructor() {
    const slug =
      this.rota.snapshot.paramMap.get(
        'slug'
      );

    if (!slug) {
      this.carregando.set(false);
      this.naoEncontrada.set(true);
      return;
    }

    this.carregarClinica(slug);
  }

  private carregarClinica(
    slug: string
  ): void {
    this.catalogo
      .buscarClinicaPorSlug(slug)
      .subscribe({
        next: (clinica) => {
          if (!clinica) {
            this.carregando.set(false);
            this.naoEncontrada.set(true);
            return;
          }

          this.clinica.set(clinica);

          combineLatest({
            servicos:
              this.catalogo.listarServicosPorClinica(
                clinica.id
              ),

            medicos:
              this.catalogo.listarMedicosPorClinica(
                clinica.id
              ),
          }).subscribe({
            next: ({
              servicos,
              medicos,
            }) => {
              this.servicos.set(
                servicos
              );

              this.medicos.set(
                medicos
              );

              this.carregando.set(
                false
              );
            },

            error: (erro) => {
              console.error(
                'Erro ao carregar dados da clínica:',
                erro
              );

              this.carregando.set(
                false
              );
            },
          });
        },

        error: (erro) => {
          console.error(
            'Erro ao carregar clínica:',
            erro
          );

          this.carregando.set(false);
          this.naoEncontrada.set(true);
        },
      });
  }
}