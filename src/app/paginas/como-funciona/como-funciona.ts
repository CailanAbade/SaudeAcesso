import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';

import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

@Component({
  selector: 'app-como-funciona',
  standalone: true,
  imports: [
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
  ],
  templateUrl: './como-funciona.html',
  styleUrl: './como-funciona.css',
})
export class ComoFunciona {}