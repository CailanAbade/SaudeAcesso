import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
} from '@angular/router';
import { combineLatest } from 'rxjs';

import {
  Firestore,
  deleteDoc,
  doc,
  setDoc,
} from '@angular/fire/firestore';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';

import {
  Clinica as ModeloClinica,
} from '../../nucleo/modelos/clinica.model';

import { Medico } from '../../nucleo/modelos/medico.model';
import { Servico } from '../../nucleo/modelos/servico.model';

@Component({
  selector: 'app-painel-clinica',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
  ],
  templateUrl: './painel-clinica.html',
  styleUrl: './painel-clinica.css',
})
export class PainelClinica {
  private autenticacao = inject(
    Autenticacao
  );

  private catalogo = inject(Catalogo);

  private preco = inject(Preco);

  private firestore = inject(Firestore);

  private roteador = inject(Router);

  clinica =
    signal<ModeloClinica | null>(null);

  servicos = signal<Servico[]>([]);

  medicos = signal<Medico[]>([]);

  carregando = signal(true);

  processandoServico =
    signal<string | null>(null);

  servicoEditando =
    signal<Servico | null>(null);

  mensagemErro =
    signal<string | null>(null);

  private clinicaIdCarregada =
    signal<string | null>(null);

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

      if (
        this.clinicaIdCarregada() ===
        usuario.clinicaId
      ) {
        return;
      }

      this.clinicaIdCarregada.set(
        usuario.clinicaId
      );

      this.carregarDados(
        usuario.clinicaId
      );
    });
  }

  private carregarDados(
    clinicaId: string
  ): void {
    this.carregando.set(true);
    this.mensagemErro.set(null);

    combineLatest({
      clinicas:
        this.catalogo.listarClinicas(),

      servicos:
        this.catalogo.listarServicosPorClinica(
          clinicaId
        ),

      medicos:
        this.catalogo.listarMedicosPorClinica(
          clinicaId
        ),
    }).subscribe({
      next: (dados) => {
        const clinicaEncontrada =
          dados.clinicas.find(
            (item) =>
              item.id === clinicaId
          ) ?? null;

        this.clinica.set(
          clinicaEncontrada
        );

        this.servicos.set(
          dados.servicos
        );

        this.medicos.set(
          dados.medicos
        );

        this.carregando.set(false);
      },

      error: (erro) => {
        console.error(
          'Erro ao carregar painel da clínica:',
          erro
        );

        this.mensagemErro.set(
          'Não foi possível carregar os dados da clínica.'
        );

        this.carregando.set(false);
      },
    });
  }

  nomeClinica(): string {
    return (
      this.clinica()?.nome ??
      'sua clínica'
    );
  }

  iniciaisClinica(): string {
    const nome =
      this.nomeClinica();

    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) =>
        parte.charAt(0)
      )
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
    const valor =
      this.clinica()?.avaliacao;

    return valor !== undefined
      ? valor
          .toFixed(1)
          .replace('.', ',')
      : '—';
  }

  verificada(): boolean {
    return (
      this.clinica()?.verificada ??
      false
    );
  }

  enderecoClinica(): string {
    const endereco =
      this.clinica()?.endereco;

    if (!endereco) {
      return '—';
    }

    return `${endereco.rua}, ${endereco.numero} — ${endereco.bairro}`;
  }

  cidadeClinica(): string {
    const endereco =
      this.clinica()?.endereco;

    if (!endereco) {
      return '—';
    }

    return `${endereco.cidade} — ${endereco.estado}`;
  }

  slugClinica(): string {
    return (
      this.clinica()?.slug ?? ''
    );
  }

  formatarReal(
    valor: number
  ): string {
    return this.preco.formatarReal(
      valor
    );
  }

  calcularDesconto(
    precoTabela: number,
    precoApp: number
  ): number {
    return this.preco.calcularDesconto(
      precoTabela,
      precoApp
    );
  }

  abrirAcoes(
    servico: Servico
  ): void {
    if (
      this.servicoEditando()?.id ===
      servico.id
    ) {
      this.servicoEditando.set(null);
      return;
    }

    this.servicoEditando.set(
      servico
    );
  }

  async alternarStatus(
    servico: Servico
  ): Promise<void> {
    const usuario =
      this.autenticacao.usuarioAtual();

    if (
      !usuario?.clinicaId ||
      usuario.clinicaId !==
        servico.clinicaId
    ) {
      console.error(
        'Clínica não autorizada para este serviço.'
      );

      return;
    }

    this.processandoServico.set(
      servico.id
    );

    this.mensagemErro.set(null);

    try {
      const novoStatus =
        servico.status === 'ativo'
          ? 'inativo'
          : 'ativo';

      const referencia = doc(
        this.firestore,
        'servicos',
        servico.id
      );

      await setDoc(
        referencia,
        {
          id: servico.id,
          clinicaId:
            servico.clinicaId,
          nome: servico.nome,
          categoriaId:
            servico.categoriaId,
          precoTabela:
            servico.precoTabela,
          precoApp:
            servico.precoApp,
          status: novoStatus,
        },
        {
          merge: true,
        }
      );

      this.servicos.update(
        (lista) =>
          lista.map((item) =>
            item.id === servico.id
              ? {
                  ...item,
                  status:
                    novoStatus,
                }
              : item
          )
      );

      this.servicoEditando.set(
        null
      );
    } catch (erro) {
      console.error(
        'Erro ao alterar status do serviço:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível alterar o status do serviço.'
      );
    } finally {
      this.processandoServico.set(
        null
      );
    }
  }

  async excluirServico(
    servico: Servico
  ): Promise<void> {
    const usuario =
      this.autenticacao.usuarioAtual();

    if (
      !usuario?.clinicaId ||
      usuario.clinicaId !==
        servico.clinicaId
    ) {
      console.error(
        'Clínica não autorizada para excluir este serviço.'
      );

      this.mensagemErro.set(
        'Você não tem permissão para excluir este serviço.'
      );

      return;
    }

    const confirmou =
      window.confirm(
        `Tem certeza que deseja excluir o serviço "${servico.nome}"?\n\nEssa ação não pode ser desfeita.`
      );

    if (!confirmou) {
      return;
    }

    this.processandoServico.set(
      servico.id
    );

    this.mensagemErro.set(null);

    try {
      const referencia = doc(
        this.firestore,
        'servicos',
        servico.id
      );

      await deleteDoc(
        referencia
      );

      this.servicos.update(
        (lista) =>
          lista.filter(
            (item) =>
              item.id !== servico.id
          )
      );

      this.servicoEditando.set(
        null
      );
    } catch (erro) {
      console.error(
        'Erro ao excluir serviço:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível excluir o serviço. Tente novamente.'
      );
    } finally {
      this.processandoServico.set(
        null
      );
    }
  }

  async sair(): Promise<void> {
    await this.autenticacao.sair();

    await this.roteador.navigate([
      '/entrar',
    ]);
  }
}