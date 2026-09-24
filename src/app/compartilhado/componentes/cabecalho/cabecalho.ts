import {
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import { Autenticacao } from '../../../nucleo/servicos/autenticacao';

@Component({
  selector: 'app-cabecalho',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.css',
})
export class CabecalhoComponent {
  private autenticacao = inject(Autenticacao);
  private roteador = inject(Router);

  menuAberto = signal(false);

  usuarioAtual = this.autenticacao.usuarioAtual;

  alternarMenu(): void {
    this.menuAberto.update(
      (aberto) => !aberto
    );
  }

  fecharMenu(): void {
    this.menuAberto.set(false);
  }

  async sair(): Promise<void> {
    this.fecharMenu();

    await this.autenticacao.sair();

    await this.roteador.navigate(['/inicio']);
  }

  nomeUsuario(): string {
    return this.usuarioAtual()?.nome ?? '';
  }

  emailUsuario(): string {
    return this.usuarioAtual()?.email ?? '';
  }

  iniciaisUsuario(): string {
    const nome = this.nomeUsuario();

    const partes = nome
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length === 0) {
      return '?';
    }

    if (partes.length === 1) {
      return partes[0].charAt(0).toUpperCase();
    }

    return (
      partes[0].charAt(0) +
      partes[partes.length - 1].charAt(0)
    ).toUpperCase();
  }

  ehPaciente(): boolean {
    return this.usuarioAtual()?.tipo === 'paciente';
  }

  ehClinica(): boolean {
    return this.usuarioAtual()?.tipo === 'clinica';
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;

    if (
      !alvo.closest('.menu-usuario') &&
      !alvo.closest('.botao-perfil')
    ) {
      this.fecharMenu();
    }
  }
}