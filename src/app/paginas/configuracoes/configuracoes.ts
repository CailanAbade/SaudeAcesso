import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  Firestore,
  doc,
  setDoc,
} from '@angular/fire/firestore';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';

import {
  Clinica,
} from '../../nucleo/modelos/clinica.model';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './configuracoes.html',
  styleUrl: './configuracoes.css',
})
export class Configuracoes {
  private autenticacao =
    inject(Autenticacao);

  private catalogo =
    inject(Catalogo);

  private firestore =
    inject(Firestore);

  private roteador =
    inject(Router);

  private formularioBuilder =
    inject(FormBuilder);

  clinica =
    signal<Clinica | null>(null);

  carregando =
    signal(true);

  salvando =
    signal(false);

  mensagemSucesso =
    signal<string | null>(null);

  mensagemErro =
    signal<string | null>(null);

  formulario =
    this.formularioBuilder.group({
      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
        ],
      ],

      cnpj: [
        '',
        [
          Validators.required,
        ],
      ],

      rua: [
        '',
        [
          Validators.required,
        ],
      ],

      numero: [
        '',
        [
          Validators.required,
        ],
      ],

      bairro: [
        '',
        [
          Validators.required,
        ],
      ],

      cidade: [
        '',
        [
          Validators.required,
        ],
      ],

      estado: [
        '',
        [
          Validators.required,
          Validators.maxLength(2),
        ],
      ],
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
        this.roteador.navigate([
          '/inicio',
        ]);

        return;
      }

      this.carregarClinica(
        usuario.clinicaId
      );
    });
  }

  private carregarClinica(
    clinicaId: string
  ): void {
    this.carregando.set(true);
    this.mensagemErro.set(null);

    this.catalogo
      .listarClinicas()
      .subscribe({
        next: (clinicas) => {
          const encontrada =
            clinicas.find(
              (clinica) =>
                clinica.id === clinicaId
            );

          if (!encontrada) {
            this.mensagemErro.set(
              'Não foi possível encontrar os dados da clínica.'
            );

            this.carregando.set(false);

            return;
          }

          this.clinica.set(
            encontrada
          );

          this.preencherFormulario(
            encontrada
          );

          this.carregando.set(false);
        },

        error: (erro) => {
          console.error(
            'Erro ao carregar configurações da clínica:',
            erro
          );

          this.mensagemErro.set(
            'Não foi possível carregar os dados da clínica.'
          );

          this.carregando.set(false);
        },
      });
  }

  private preencherFormulario(
    clinica: Clinica
  ): void {
    this.formulario.patchValue({
      nome: clinica.nome ?? '',

      cnpj:
        (clinica as Clinica & {
          cnpj?: string;
        }).cnpj ?? '',

      rua:
        clinica.endereco?.rua ?? '',

      numero:
        clinica.endereco?.numero ?? '',

      bairro:
        clinica.endereco?.bairro ?? '',

      cidade:
        clinica.endereco?.cidade ?? '',

      estado:
        clinica.endereco?.estado ?? '',
    });
  }

  async salvar(): Promise<void> {
    this.mensagemSucesso.set(null);
    this.mensagemErro.set(null);

    if (
      this.formulario.invalid
    ) {
      this.formulario.markAllAsTouched();

      this.mensagemErro.set(
        'Preencha todos os campos obrigatórios.'
      );

      return;
    }

    const usuario =
      this.autenticacao.usuarioAtual();

    const clinicaAtual =
      this.clinica();

    if (
      !usuario?.clinicaId ||
      !clinicaAtual
    ) {
      this.mensagemErro.set(
        'Não foi possível identificar a clínica.'
      );

      return;
    }

    if (
      usuario.clinicaId !==
      clinicaAtual.id
    ) {
      this.mensagemErro.set(
        'Você não tem permissão para editar esta clínica.'
      );

      return;
    }

    this.salvando.set(true);

    try {
      const valores =
        this.formulario.getRawValue();

      const nome =
        valores.nome?.trim() ?? '';

      const cnpj =
        valores.cnpj?.trim() ?? '';

      const rua =
        valores.rua?.trim() ?? '';

      const numero =
        valores.numero?.trim() ?? '';

      const bairro =
        valores.bairro?.trim() ?? '';

      const cidade =
        valores.cidade?.trim() ?? '';

      const estado =
        valores.estado
          ?.trim()
          .toUpperCase() ?? '';

      const referencia =
        doc(
          this.firestore,
          'clinicas',
          clinicaAtual.id
        );

      await setDoc(
        referencia,
        {
          ...clinicaAtual,

          id: clinicaAtual.id,

          nome,

          cnpj,

          endereco: {
            ...clinicaAtual.endereco,

            rua,
            numero,
            bairro,
            cidade,
            estado,
          },
        },
        {
          merge: true,
        }
      );

      this.clinica.update(
        (atual) =>
          atual
            ? {
                ...atual,

                nome,

                endereco: {
                  ...atual.endereco,

                  rua,
                  numero,
                  bairro,
                  cidade,
                  estado,
                },
              }
            : atual
      );

      this.formulario.markAsPristine();

      this.mensagemSucesso.set(
        'Dados da clínica atualizados com sucesso.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (erro) {
      console.error(
        'Erro ao salvar configurações da clínica:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível salvar as alterações. Tente novamente.'
      );
    } finally {
      this.salvando.set(false);
    }
  }

  campoInvalido(
    campo: string
  ): boolean {
    const controle =
      this.formulario.get(campo);

    return !!(
      controle &&
      controle.invalid &&
      controle.touched
    );
  }

  async sair(): Promise<void> {
    await this.autenticacao.sair();

    await this.roteador.navigate([
      '/entrar',
    ]);
  }
}