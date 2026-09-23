import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
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
import { Horario } from '../../nucleo/modelos/horario.model';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
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

  private autenticacao = inject(
    Autenticacao
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

  horarios =
    signal<Horario[]>([]);

  carregando =
    signal(true);

  naoEncontrada =
    signal(false);

  ehClinicaLogada =
    computed(() => {
      const usuario =
        this.autenticacao.usuarioAtual();

      return (
        usuario?.tipo === 'clinica'
      );
    });

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

            horarios:
              this.catalogo.listarHorariosPorClinica(
                clinica.id
              ),
          }).subscribe({
            next: ({
              servicos,
              medicos,
              horarios,
            }) => {
              this.servicos.set(
                servicos
              );

              this.medicos.set(
                medicos
              );

              this.horarios.set(
                horarios
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