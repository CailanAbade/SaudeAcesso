import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { Clinica } from '../modelos/clinica.model';
import { Servico } from '../modelos/servico.model';
import { Medico } from '../modelos/medico.model';

interface BancoDados {
  clinicas: Clinica[];
  servicos: Servico[];
  medicos: Medico[];
  [chave: string]: unknown;
}

export interface ServicoComClinica extends Servico {
  clinica: Clinica;
}

@Injectable({ providedIn: 'root' })
export class Catalogo {
  private http = inject(HttpClient);

  private banco$ = this.http
    .get<BancoDados>('assets/banco-dados.json')
    .pipe(shareReplay(1));

  listarClinicas(): Observable<Clinica[]> {
    return this.banco$.pipe(map((banco) => banco.clinicas));
  }

  buscarClinicaPorSlug(slug: string): Observable<Clinica | undefined> {
    return this.banco$.pipe(
      map((banco) => banco.clinicas.find((clinica) => clinica.slug === slug))
    );
  }

  listarServicosPorClinica(clinicaId: string): Observable<Servico[]> {
    return this.banco$.pipe(
      map((banco) => banco.servicos.filter((servico) => servico.clinicaId === clinicaId))
    );
  }

  listarMedicosPorClinica(clinicaId: string): Observable<Medico[]> {
    return this.banco$.pipe(
      map((banco) => banco.medicos.filter((medico) => medico.clinicaId === clinicaId))
    );
  }

  listarMenorPreco(): Observable<Servico[]> {
    return this.banco$.pipe(
      map((banco) => [...banco.servicos].sort((a, b) => a.precoApp - b.precoApp))
    );
  }

  listarServicosComClinica(): Observable<ServicoComClinica[]> {
    return this.banco$.pipe(
      map((banco) =>
        banco.servicos
          .map((servico) => {
            const clinica = banco.clinicas.find((c) => c.id === servico.clinicaId);
            return clinica ? { ...servico, clinica } : null;
          })
          .filter((item): item is ServicoComClinica => item !== null)
      )
    );
  }
}