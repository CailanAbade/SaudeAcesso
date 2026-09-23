import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  Firestore,
  collection,
  doc,
  setDoc,
} from '@angular/fire/firestore';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Horario } from '../../nucleo/modelos/horario.model';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class Horarios {
  private autenticacao = inject(Autenticacao);
  private catalogo = inject(Catalogo);
  private firestore = inject(Firestore);
  private roteador = inject(Router);
  private fb = inject(FormBuilder);

  horarios = signal<Horario[]>([]);
  carregando = signal(true);
  salvando = signal(false);
  mensagemErro = signal<string | null>(null);
  mensagemSucesso = signal<string | null>(null);

  private clinicaIdCarregada =
    signal<string | null>(null);

  formulario = this.fb.group({
    segunda: this.criarGrupoHorario(),
    terca: this.criarGrupoHorario(),
    quarta: this.criarGrupoHorario(),
    quinta: this.criarGrupoHorario(),
    sexta: this.criarGrupoHorario(),
    sabado: this.criarGrupoHorario(),
    domingo: this.criarGrupoHorario(),
  });

  constructor() {
    effect(() => {
      const carregandoSessao =
        this.autenticacao.carregandoSessao();

      if (carregandoSessao) {
        return;
      }

      const usuario =
        this.autenticacao.usuarioAtual();

      if (
        !usuario ||
        usuario.tipo !== 'clinica' ||
        !usuario.clinicaId
      ) {
        this.roteador.navigate(['/inicio']);
        return;
      }

      if (
        this.clinicaIdCarregada() ===
        usuario.clinicaId
      ) {
        return;
      }

      this.clinicaIdCarregada.set(
        usuario.clinicaId
      );

      this.carregarHorarios(
        usuario.clinicaId
      );
    });
  }

  private criarGrupoHorario() {
    return this.fb.group({
      aberto: [true],
      abertura: [
        '08:00',
        Validators.required,
      ],
      fechamento: [
        '18:00',
        Validators.required,
      ],
    });
  }

  private carregarHorarios(
    clinicaId: string
  ): void {
    this.carregando.set(true);
    this.mensagemErro.set(null);

    this.catalogo
      .listarHorariosPorClinica(clinicaId)
      .subscribe({
        next: (horarios) => {
          this.horarios.set(horarios);

          /*
           * Enquanto estamos salvando, o Firestore pode
           * emitir atualizações intermediárias.
           *
           * Não podemos deixar essas atualizações
           * sobrescrever os valores que o usuário acabou
           * de colocar no formulário.
           */
          if (this.salvando()) {
            return;
          }

          this.preencherFormulario(horarios);
          this.carregando.set(false);
        },

        error: (erro) => {
          console.error(
            'Erro ao carregar horários:',
            erro
          );

          this.mensagemErro.set(
            'Não foi possível carregar os horários.'
          );

          this.carregando.set(false);
        },
      });
  }

  private preencherFormulario(
    horarios: Horario[]
  ): void {
    const controles = [
      'segunda',
      'terca',
      'quarta',
      'quinta',
      'sexta',
      'sabado',
      'domingo',
    ] as const;

    controles.forEach(
      (controle, indice) => {
        const horario =
          horarios.find(
            (item) =>
              item.diaSemana === indice
          );

        if (!horario) {
          return;
        }

        this.formulario
          .get(controle)
          ?.patchValue({
            aberto: horario.aberto,
            abertura:
              horario.abertura,
            fechamento:
              horario.fechamento,
          });
      }
    );
  }

  async salvar(): Promise<void> {
    const usuario =
      this.autenticacao.usuarioAtual();

    if (!usuario?.clinicaId) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    const dias = [
      {
        nome: 'Segunda-feira',
        controle: 'segunda',
      },
      {
        nome: 'Terça-feira',
        controle: 'terca',
      },
      {
        nome: 'Quarta-feira',
        controle: 'quarta',
      },
      {
        nome: 'Quinta-feira',
        controle: 'quinta',
      },
      {
        nome: 'Sexta-feira',
        controle: 'sexta',
      },
      {
        nome: 'Sábado',
        controle: 'sabado',
      },
      {
        nome: 'Domingo',
        controle: 'domingo',
      },
    ] as const;

    try {
      const colecao =
        collection(
          this.firestore,
          'horarios'
        );

      const horariosSalvos: Horario[] = [];

      /*
       * Primeiro pegamos TODOS os valores do formulário.
       *
       * Assim, mesmo que o Firestore emita alguma atualização
       * durante o processo, os dados que serão gravados já
       * estão guardados aqui.
       */
      for (
        let indice = 0;
        indice < dias.length;
        indice++
      ) {
        const dia = dias[indice];

        const valores =
          this.formulario.get(
            dia.controle
          )?.value;

        const horario: Horario = {
          id: `${usuario.clinicaId}-${indice}`,
          clinicaId:
            usuario.clinicaId,
          diaSemana: indice,
          diaNome: dia.nome,
          aberto:
            valores?.aberto ?? true,
          abertura:
            valores?.abertura ?? '08:00',
          fechamento:
            valores?.fechamento ?? '18:00',
        };

        horariosSalvos.push(horario);
      }

      /*
       * Agora gravamos todos os dias.
       */
      await Promise.all(
        horariosSalvos.map(
          (horario) =>
            setDoc(
              doc(
                colecao,
                horario.id
              ),
              horario
            )
        )
      );

      /*
       * Atualizamos a aplicação imediatamente com os mesmos
       * dados que acabaram de ser enviados ao Firestore.
       */
      this.horarios.set(
        horariosSalvos
      );

      this.mensagemSucesso.set(
        'Horários salvos com sucesso!'
      );
    } catch (erro) {
      console.error(
        'Erro ao salvar horários:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível salvar os horários. Tente novamente.'
      );
    } finally {
      this.salvando.set(false);
    }
  }

  async sair(): Promise<void> {
    await this.autenticacao.sair();

    await this.roteador.navigate([
      '/entrar',
    ]);
  }
}
