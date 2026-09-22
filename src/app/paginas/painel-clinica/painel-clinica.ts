import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';
import { Clinica as ModeloClinica } from '../../nucleo/modelos/clinica.model';
import { Medico } from '../../nucleo/modelos/medico.model';
import { Servico } from '../../nucleo/modelos/servico.model';

@Component({
  selector: 'app-painel-clinica',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './painel-clinica.html',
  styleUrl: './painel-clinica.css',
})
export class PainelClinica {
  private autenticacao = inject(Autenticacao);
  private catalogo = inject(Catalogo);
  private preco = inject(Preco);
  private roteador = inject(Router);

  clinica = signal<ModeloClinica | null>(null);
  servicos = signal<Servico[]>([]);
  medicos = signal<Medico[]>([]);

  carregando = signal(true);

  private clinicaIdCarregada = signal<string | null>(null);

  constructor() {
    effect(() => {
      const carregandoSessao = this.autenticacao.carregandoSessao();

      // Ainda estamos esperando o Firebase/Firestore carregar o perfil.
      if (carregandoSessao) {
        return;
      }

      const usuario = this.autenticacao.usuarioAtual();

      // Só toma a decisão depois que a sessão terminou de carregar.
      if (!usuario || usuario.tipo !== 'clinica' || !usuario.clinicaId) {
        this.roteador.navigate(['/inicio']);
        return;
      }

      // Evita carregar os mesmos dados novamente.
      if (this.clinicaIdCarregada() === usuario.clinicaId) {
        return;
      }

      this.clinicaIdCarregada.set(usuario.clinicaId);
      this.carregarDados(usuario.clinicaId);
    });
  }

  private carregarDados(clinicaId: string): void {
    this.carregando.set(true);

    forkJoin({
      clinicas: this.catalogo.listarClinicas(),
      servicos: this.catalogo.listarServicosPorClinica(clinicaId),
      medicos: this.catalogo.listarMedicosPorClinica(clinicaId),
    }).subscribe({
      next: (dados) => {
        const clinicaEncontrada =
          dados.clinicas.find((item) => item.id === clinicaId) ?? null;

        this.clinica.set(clinicaEncontrada);
        this.servicos.set(dados.servicos);
        this.medicos.set(dados.medicos);
        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('Erro ao carregar painel da clínica:', erro);
        this.carregando.set(false);
      },
    });
  }

  nomeClinica(): string {
    return this.clinica()?.nome ?? 'sua clínica';
  }

  iniciaisClinica(): string {
    const nome = this.nomeClinica();

    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  quantidadeServicos(): number {
    return this.servicos().length;
  }

  quantidadeMedicos(): number {
    return this.medicos().length;
  }

  avaliacao(): string {
    const valor = this.clinica()?.avaliacao;

    return valor !== undefined ? valor.toFixed(1).replace('.', ',') : '—';
  }

  verificada(): boolean {
    return this.clinica()?.verificada ?? false;
  }

  enderecoClinica(): string {
    const endereco = this.clinica()?.endereco;

    if (!endereco) {
      return '—';
    }

    return `${endereco.rua}, ${endereco.numero} — ${endereco.bairro}`;
  }

  cidadeClinica(): string {
    const endereco = this.clinica()?.endereco;

    if (!endereco) {
      return '—';
    }

    return `${endereco.cidade} — ${endereco.estado}`;
  }

  slugClinica(): string {
    return this.clinica()?.slug ?? '';
  }

  formatarReal(valor: number): string {
    return this.preco.formatarReal(valor);
  }

  calcularDesconto(precoTabela: number, precoApp: number): number {
    return this.preco.calcularDesconto(precoTabela, precoApp);
  }

  async sair(): Promise<void> {
    await this.autenticacao.sair();
    await this.roteador.navigate(['/entrar']);
  }
}

