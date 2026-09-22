import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Preco {
  calcularDesconto(precoTabela: number, precoApp: number): number {
    if (precoTabela <= 0) return 0;
    const percentual = ((precoTabela - precoApp) / precoTabela) * 100;
    return Math.round(percentual);
  }

  calcularEconomia(precoTabela: number, precoApp: number): number {
    return Math.max(precoTabela - precoApp, 0);
  }

  formatarReal(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}