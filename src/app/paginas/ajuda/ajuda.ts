import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

import { CabecalhoComponent } from '../../compartilhado/componentes/cabecalho/cabecalho';

import { RodapeComponent } from '../../compartilhado/componentes/rodape/rodape';

@Component({
  selector: 'app-ajuda',
  standalone: true,
  imports: [
    RouterLink,
    CabecalhoComponent,
    RodapeComponent,
  ],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.css',
})
export class Ajuda {}