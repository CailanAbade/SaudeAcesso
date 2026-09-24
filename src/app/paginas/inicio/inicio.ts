import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  Catalogo,
} from '../../nucleo/servicos/catalogo';

import {
  Preco,
} from '../../nucleo/servicos/preco';

import {
  Clinica,
} from '../../nucleo/modelos/clinica.model';

import {
  CabecalhoComponent,
} from '../../compartilhado/componentes/cabecalho/cabecalho';

import {
  RodapeComponent,
} from '../../compartilhado/componentes/rodape/rodape';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
    FormsModule,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioComponent {
  private catalogo = inject(Catalogo);
  private roteador = inject(Router);

  preco = inject(Preco);

  clinicas = signal<Clinica[]>([]);

  termoBusca = signal('');

  buscando = signal(false);

  private nomesServicos = signal<string[]>([]);
  private nomesClinicas = signal<string[]>([]);

  sugestoesBusca = computed(() => {
    const termo = this.termoBusca()
      .trim()
      .toLowerCase();

    if (termo.length < 2) {
      return [];
    }

    const servicos = this.nomesServicos()
      .filter((nome) =>
        nome.toLowerCase().includes(termo)
      );

    const clinicas = this.nomesClinicas()
      .filter((nome) =>
        nome.toLowerCase().includes(termo)
      );

    return [
      ...new Set([
        ...servicos,
        ...clinicas,
      ]),
    ].slice(0, 6);
  });

  constructor() {
    this.catalogo
      .listarClinicas()
      .subscribe((lista) => {
        this.clinicas.set(lista);

        this.nomesClinicas.set(
          lista.map(
            (clinica) => clinica.nome
          )
        );
      });

    this.catalogo
      .listarServicosComClinica()
      .subscribe((lista) => {
        this.nomesServicos.set(
          lista.map(
            (servico) => servico.nome
          )
        );
      });
  }

  alterarTermoBusca(
    valor: string
  ): void {
    this.termoBusca.set(valor);
  }

  selecionarSugestao(
    sugestao: string
  ): void {
    this.termoBusca.set(sugestao);
    this.buscar();
  }

  esconderSugestoes(): void {
    setTimeout(() => {
      this.buscando.set(false);
    }, 150);
  }

  buscar(): void {
    this.buscando.set(false);

    const termo =
      this.termoBusca().trim();

    this.roteador.navigate(
      ['/resultados'],
      {
        queryParams: {
          termo: termo || null,
        },
      }
    );
  }
}