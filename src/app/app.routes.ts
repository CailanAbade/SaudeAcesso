import { Routes } from '@angular/router';
import { autenticacaoGuard } from './nucleo/guardas/autenticacao-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./paginas/inicio/inicio').then(
        (m) => m.InicioComponent
      ),
    title:
      'SaúdeAcesso | Encontre médicos e exames com preço justo',
  },
  {
    path: 'resultados',
    loadComponent: () =>
      import('./paginas/resultados/resultados').then(
        (m) => m.ResultadosComponent
      ),
    title:
      'SaúdeAcesso | Resultados da busca',
  },
  {
    path: 'entrar',
    loadComponent: () =>
      import('./paginas/autenticacao/autenticacao').then(
        (m) => m.AutenticacaoComponent
      ),
    title: 'SaúdeAcesso | Entrar',
  },
  {
    path: 'privacidade',
    loadComponent: () =>
      import('./paginas/privacidade/privacidade').then(
        (m) => m.PrivacidadeComponent
      ),
    title:
      'SaúdeAcesso | Política de Privacidade e LGPD',
  },
  {
    path: 'clinicas/:slug',
    loadComponent: () =>
      import('./paginas/clinica/clinica').then(
        (m) => m.ClinicaComponent
      ),
    title:
      'SaúdeAcesso | Perfil da clínica',
  },
  {
    path: 'cadastrar-servico',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import(
        './paginas/cadastrar-servico/cadastrar-servico'
      ).then(
        (m) => m.CadastrarServico
      ),
    title:
      'SaúdeAcesso | Cadastrar novo serviço',
  },
  {
    path: 'painel-clinica',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import(
        './paginas/painel-clinica/painel-clinica'
      ).then(
        (m) => m.PainelClinica
      ),
    title:
      'SaúdeAcesso | Painel da Clínica',
  },
  {
    path: 'editar-servico/:id',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import(
        './paginas/editar-servico/editar-servico'
      ).then(
        (m) => m.EditarServico
      ),
    title:
      'SaúdeAcesso | Editar serviço',
  },
];