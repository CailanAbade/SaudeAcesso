import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';

import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

@Component({
  selector: 'app-para-clinicas',
  standalone: true,
  imports: [
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
  ],
  templateUrl: './para-clinicas.html',
  styleUrl: './para-clinicas.css',
})
export class ParaClinicas {}