import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Firestore,
  collection,
  collectionData,
} from '@angular/fire/firestore';
import {
  Observable,
  combineLatest,
  map,
  shareReplay,
} from 'rxjs';

import { Clinica } from '../modelos/clinica.model';
import { Servico } from '../modelos/servico.model';
import { Medico } from '../modelos/medico.model';

interface BancoDados {
  clinicas: Clinica[];
  servicos: Servico[];
  medicos: Medico[];
}

export interface ServicoComClinica extends Servico {
  clinica: Clinica;
}

@Injectable({
  providedIn: 'root',
})
export class Catalogo {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);

  private banco$ = this.http
    .get<BancoDados>('assets/banco-dados.json')
    .pipe(shareReplay(1));

  private servicosFirestore$ = collectionData(
    collection(this.firestore, 'servicos'),
    { idField: 'id' }
  ) as Observable<Servico[]>;

  listarClinicas(): Observable<Clinica[]> {
    return this.banco$.pipe(
      map((banco) => banco.clinicas)
    );
  }

  listarClinicaPorSlug(
    slug: string
  ): Observable<Clinica | undefined> {
    return this.banco$.pipe(
      map((banco) =>
        banco.clinicas.find(
          (clinica) => clinica.slug === slug
        )
      )
    );
  }

  buscarClinicaPorSlug(
    slug: string
  ): Observable<Clinica | undefined> {
    return this.listarClinicaPorSlug(slug);
  }

  listarServicosPorClinica(
    clinicaId: string
  ): Observable<Servico[]> {
    return combineLatest([
      this.banco$.pipe(
        map((banco) =>
          banco.servicos.filter(
            (servico) =>
              servico.clinicaId === clinicaId
          )
        )
      ),

      this.servicosFirestore$.pipe(
        map((servicos) =>
          servicos.filter(
            (servico) =>
              servico.clinicaId === clinicaId
          )
        )
      ),
    ]).pipe(
      map(([servicosJson, servicosFirestore]) => {
        const idsFirestore = new Set(
          servicosFirestore.map(
            (servico) => servico.id
          )
        );

        const servicosJsonSemDuplicados =
          servicosJson.filter(
            (servico) =>
              !idsFirestore.has(servico.id)
          );

        return [
          ...servicosJsonSemDuplicados,
          ...servicosFirestore,
        ];
      })
    );
  }

  listarServicosComClinica(): Observable<
    ServicoComClinica[]
  > {
    return combineLatest([
      this.banco$,
      this.servicosFirestore$,
    ]).pipe(
      map(([banco, servicosFirestore]) => {
        const servicosJson = banco.servicos;

        const idsFirestore = new Set(
          servicosFirestore.map(
            (servico) => servico.id
          )
        );

        const servicosJsonSemDuplicados =
          servicosJson.filter(
            (servico) =>
              !idsFirestore.has(servico.id)
          );

        const todosServicos = [
          ...servicosJsonSemDuplicados,
          ...servicosFirestore,
        ];

        return todosServicos
          .map((servico) => {
            const clinica = banco.clinicas.find(
              (item) =>
                item.id === servico.clinicaId
            );

            if (!clinica) {
              return null;
            }

            return {
              ...servico,
              clinica,
            };
          })
          .filter(
            (
              item
            ): item is ServicoComClinica =>
              item !== null
          );
      })
    );
  }

  listarMedicosPorClinica(
    clinicaId: string
  ): Observable<Medico[]> {
    return this.banco$.pipe(
      map((banco) =>
        banco.medicos.filter(
          (medico) =>
            medico.clinicaId === clinicaId
        )
      )
    );
  }
}