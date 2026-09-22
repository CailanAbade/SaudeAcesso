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
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoComponent, RodapeComponent],
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
      lista = lista.filter(
        (servico) =>
          servico.nome.toLowerCase().includes(termo) ||
          servico.clinica.nome.toLowerCase().includes(termo) ||
          servico.clinica.endereco.bairro.toLowerCase().includes(termo)
      );
    }

    return [...lista].sort((a, b) =>
      this.ordenacao() === 'menor' ? a.precoApp - b.precoApp : b.precoApp - a.precoApp
    );
  });

  constructor() {
    this.catalogo.listarServicosComClinica().subscribe((lista) => this.todosServicos.set(lista));

    const termoInicial = this.rotaAtiva.snapshot.queryParamMap.get('termo');
    if (termoInicial) this.termoBusca.set(termoInicial);
  }

  alternarOrdenacao(valor: OrdenacaoPreco): void {
    this.ordenacao.set(valor);
  }
}