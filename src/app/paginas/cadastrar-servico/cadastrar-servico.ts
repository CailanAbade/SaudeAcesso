import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Firestore,
  addDoc,
  collection,
} from '@angular/fire/firestore';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Preco } from '../../nucleo/servicos/preco';

@Component({
  selector: 'app-cadastrar-servico',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastrar-servico.html',
  styleUrl: './cadastrar-servico.css',
})
export class CadastrarServico {
  private construtorFormulario = inject(FormBuilder);
  private autenticacao = inject(Autenticacao);
  private preco = inject(Preco);
  private firestore = inject(Firestore);
  private roteador = inject(Router);

  enviando = signal(false);
  mensagemErro = signal<string | null>(null);

  formulario = this.construtorFormulario.group({
    nome: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
      ],
    ],

    categoria: [
      '',
      [Validators.required],
    ],

    precoTabela: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
      ],
    ],

    precoApp: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
      ],
    ],
  });

  get precoTabela(): number {
    return (
      Number(
        this.formulario.controls.precoTabela.value
      ) || 0
    );
  }

  get precoApp(): number {
    return (
      Number(
        this.formulario.controls.precoApp.value
      ) || 0
    );
  }

  get desconto(): number {
    return this.preco.calcularDesconto(
      this.precoTabela,
      this.precoApp
    );
  }

  get economia(): number {
    return this.preco.calcularEconomia(
      this.precoTabela,
      this.precoApp
    );
  }

  formatarReal(valor: number): string {
    return this.preco.formatarReal(valor);
  }

  async cadastrar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const usuario =
      this.autenticacao.usuarioAtual();

    if (
      !usuario ||
      usuario.tipo !== 'clinica' ||
      !usuario.clinicaId
    ) {
      this.mensagemErro.set(
        'Não foi possível identificar a clínica da sua conta.'
      );

      return;
    }

    if (
      this.precoApp >
      this.precoTabela
    ) {
      this.mensagemErro.set(
        'O preço SaúdeAcesso não pode ser maior que o preço de tabela.'
      );

      return;
    }

    this.enviando.set(true);
    this.mensagemErro.set(null);

    try {
      const servicos = collection(
        this.firestore,
        'servicos'
      );

      await addDoc(servicos, {
        clinicaId:
          usuario.clinicaId,

        nome:
          this.formulario.controls.nome.value!.trim(),

        categoriaId:
          this.formulario.controls.categoria.value!,

        precoTabela:
          this.precoTabela,

        precoApp:
          this.precoApp,

        status: 'ativo',
      });

      await this.roteador.navigate([
        '/painel-clinica',
      ]);
    } catch (erro) {
      console.error(
        'Erro ao cadastrar serviço:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível cadastrar o serviço. Tente novamente.'
      );
    } finally {
      this.enviando.set(false);
    }
  }
}