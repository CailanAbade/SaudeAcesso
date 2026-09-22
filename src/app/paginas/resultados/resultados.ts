import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { Catalogo, ServicoComClinica } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';

import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';
import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

type OrdenacaoPreco = 'menor' | 'maior';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
  ],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css',
})
export class ResultadosComponent {
  private catalogo = inject(Catalogo);
  private rotaAtiva = inject(ActivatedRoute);

  preco = inject(Preco);

  todosServicos = signal<ServicoComClinica[]>([]);
  termoBusca = signal('');
  ordenacao = signal<OrdenacaoPreco>('menor');

  servicosFiltrados = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();

    let lista = this.todosServicos();

    if (termo) {
      lista = lista.filter((servico) => {
        const nomeServico = servico.nome.toLowerCase();
        const nomeClinica = servico.clinica.nome.toLowerCase();
        const bairro = servico.clinica.endereco.bairro.toLowerCase();
        const cidade = servico.clinica.endereco.cidade.toLowerCase();

        return (
          nomeServico.includes(termo) ||
          nomeClinica.includes(termo) ||
          bairro.includes(termo) ||
          cidade.includes(termo)
        );
      });
    }

    return [...lista].sort((a, b) => {
      if (this.ordenacao() === 'menor') {
        return a.precoApp - b.precoApp;
      }

      return b.precoApp - a.precoApp;
    });
  });

  constructor() {
    this.catalogo.listarServicosComClinica().subscribe({
      next: (lista) => {
        this.todosServicos.set(lista);
      },
    });

    const termoInicial = this.rotaAtiva.snapshot.queryParamMap.get('termo');

    if (termoInicial) {
      this.termoBusca.set(termoInicial);
    }
  }

  alterarTermoBusca(valor: string): void {
    this.termoBusca.set(valor);
  }

  alternarOrdenacao(valor: OrdenacaoPreco): void {
    this.ordenacao.set(valor);
  }
}