import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () =>
      import('./paginas/inicio/inicio').then((m) => m.InicioComponent),
    title: 'SaúdeAcesso | Encontre médicos e exames com preço justo',
  },
  {
    path: 'resultados',
    loadComponent: () =>
      import('./paginas/resultados/resultados').then((m) => m.ResultadosComponent),
    title: 'SaúdeAcesso | Resultados da busca',
  },
  {
    path: 'entrar',
    loadComponent: () =>
      import('./paginas/autenticacao/autenticacao').then((m) => m.AutenticacaoComponent),
    title: 'SaúdeAcesso | Entrar',
  },
];