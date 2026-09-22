import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';
import { Clinica } from '../../nucleo/modelos/clinica.model';
import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';
import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, CabecalhoComponent, RodapeComponent, FormsModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioComponent {
  private catalogo = inject(Catalogo);
  private roteador = inject(Router);
  preco = inject(Preco);

  clinicas = signal<Clinica[]>([]);
  termoBusca = '';

  constructor() {
    this.catalogo.listarClinicas().subscribe((lista) => this.clinicas.set(lista));
  }

  buscar(): void {
    this.roteador.navigate(['/resultados'], {
      queryParams: { termo: this.termoBusca || null },
    });
  }
}