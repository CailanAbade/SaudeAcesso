import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { traduzirErroFirebase } from '../../nucleo/utilitarios/erros-firebase.util';
import { TipoUsuario } from '../../nucleo/modelos/usuario.model';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-autenticacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './autenticacao.html',
  styleUrl: './autenticacao.css',
})
export class AutenticacaoComponent {
  private construtorFormulario = inject(FormBuilder);
  private autenticacao = inject(Autenticacao);
  private roteador = inject(Router);
  private rotaAtiva = inject(ActivatedRoute);

  modo = signal<'entrar' | 'cadastrar'>('entrar');
  tipoUsuario = signal<TipoUsuario>('paciente');
  enviando = signal(false);
  mensagemErro = signal<string | null>(null);
  senhaVisivel = signal(false);

  formularioEntrar = this.construtorFormulario.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  formularioCadastro = this.construtorFormulario.group(
    {
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      cpf: [''],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      aceiteTermos: [false, [Validators.requiredTrue]],
    },
    { validators: senhasIguaisValidator }
  );

  alternarModo(novoModo: 'entrar' | 'cadastrar'): void {
    this.modo.set(novoModo);
    this.mensagemErro.set(null);
  }

  selecionarTipo(tipo: TipoUsuario): void {
    this.tipoUsuario.set(tipo);

    const controleCpf = this.formularioCadastro.get('cpf');
    if (tipo === 'paciente') {
      controleCpf?.setValidators([Validators.required, Validators.minLength(11)]);
    } else {
      controleCpf?.clearValidators();
    }
    controleCpf?.updateValueAndValidity();
  }

  alternarVisibilidadeSenha(): void {
    this.senhaVisivel.update((valor) => !valor);
  }

  async aoEnviarEntrar(): Promise<void> {
    if (this.formularioEntrar.invalid) {
      this.formularioEntrar.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.mensagemErro.set(null);

    const { email, senha } = this.formularioEntrar.getRawValue();

    try {
      await this.autenticacao.entrar(email!, senha!);
      this.redirecionarAposSucesso();
    } catch (erro) {
      this.tratarErro(erro);
    } finally {
      this.enviando.set(false);
    }
  }

  async aoEnviarCadastro(): Promise<void> {
    if (this.formularioCadastro.invalid) {
      this.formularioCadastro.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.mensagemErro.set(null);

    const dados = this.formularioCadastro.getRawValue();

    try {
      await this.autenticacao.cadastrar({
        nome: dados.nome!,
        email: dados.email!,
        senha: dados.senha!,
        tipo: this.tipoUsuario(),
        cpf: this.tipoUsuario() === 'paciente' ? dados.cpf! : undefined,
      });
      this.redirecionarAposSucesso();
    } catch (erro) {
      this.tratarErro(erro);
    } finally {
      this.enviando.set(false);
    }
  }

  private redirecionarAposSucesso(): void {
    const destino = this.rotaAtiva.snapshot.queryParamMap.get('redirecionar');
    this.roteador.navigateByUrl(destino ? `/${destino}` : '/');
  }

 private tratarErro(erro: unknown): void {
  console.error('ERRO COMPLETO DO FIREBASE:', erro);

  if (erro instanceof FirebaseError) {
    console.error('CÓDIGO FIREBASE:', erro.code);
    console.error('MENSAGEM FIREBASE:', erro.message);

    this.mensagemErro.set(traduzirErroFirebase(erro.code));
  } else {
    console.error('ERRO NÃO RECONHECIDO:', erro);
    this.mensagemErro.set('Ocorreu um erro inesperado. Tente novamente.');
  }
}
}