import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const autenticacaoGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const roteador = inject(Router);

  return user(auth).pipe(
    take(1),
    map((usuarioLogado) => {
      if (usuarioLogado) return true;
      roteador.navigate(['/entrar'], { queryParams: { redirecionar: 'painel' } });
      return false;
    })
  );
};