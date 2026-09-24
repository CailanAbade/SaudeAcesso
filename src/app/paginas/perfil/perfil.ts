import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  CommonModule,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  Autenticacao,
} from '../../nucleo/servicos/autenticacao';

import {
  CabecalhoComponent,
} from '../../compartilhado/componentes/cabecalho/cabecalho';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CabecalhoComponent,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private autenticacao =
    inject(Autenticacao);

  private roteador =
    inject(Router);

  usuarioAtual =
    this.autenticacao.usuarioAtual;

  nome = signal('');
  cpf = signal('');

  salvando = signal(false);
  mensagemSucesso = signal('');
  mensagemErro = signal('');

  constructor() {
    const usuario =
      this.usuarioAtual();

    if (!usuario) {
      this.roteador.navigate([
        '/inicio',
      ]);

      return;
    }

    this.nome.set(
      usuario.nome
    );

    this.cpf.set(
      usuario.cpf ?? ''
    );
  }

  alterarNome(
    valor: string
  ): void {
    this.nome.set(valor);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
  }

  alterarCpf(
    valor: string
  ): void {
    this.cpf.set(valor);
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');
  }

  async salvar(): Promise<void> {
    this.mensagemSucesso.set('');
    this.mensagemErro.set('');

    const nome =
      this.nome().trim();

    if (!nome) {
      this.mensagemErro.set(
        'Informe seu nome.'
      );

      return;
    }

    this.salvando.set(true);

    try {
      await this.autenticacao
        .atualizarPerfil({
          nome,
          cpf:
            this.cpf().trim(),
        });

      this.mensagemSucesso.set(
        'Perfil atualizado com sucesso.'
      );
    } catch (erro) {
      console.error(erro);

      this.mensagemErro.set(
        'Não foi possível atualizar seu perfil.'
      );
    } finally {
      this.salvando.set(false);
    }
  }
}