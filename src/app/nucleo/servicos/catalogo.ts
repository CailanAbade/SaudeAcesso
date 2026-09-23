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
import { Horario } from '../modelos/horario.model';


interface BancoDados {
  clinicas: Clinica[];
  servicos: Servico[];
  medicos: Medico[];
  horarios?: Horario[];
}


export interface ServicoComClinica
  extends Servico {
  clinica: Clinica;
}


@Injectable({
  providedIn: 'root',
})
export class Catalogo {

  private http =
    inject(HttpClient);

  private firestore =
    inject(Firestore);


  private banco$ =
    this.http
      .get<BancoDados>(
        'assets/banco-dados.json'
      )
      .pipe(
        shareReplay(1)
      );


  private clinicasFirestore$ =
    collectionData(
      collection(
        this.firestore,
        'clinicas'
      ),
      {
        idField: 'id',
      }
    ) as Observable<Clinica[]>;


  private servicosFirestore$ =
    collectionData(
      collection(
        this.firestore,
        'servicos'
      ),
      {
        idField: 'id',
      }
    ) as Observable<Servico[]>;


  private medicosFirestore$ =
    collectionData(
      collection(
        this.firestore,
        'medicos'
      ),
      {
        idField: 'id',
      }
    ) as Observable<Medico[]>;


  private horariosFirestore$ =
    collectionData(
      collection(
        this.firestore,
        'horarios'
      ),
      {
        idField: 'id',
      }
    ) as Observable<Horario[]>;


  listarClinicas():
    Observable<Clinica[]> {

    return combineLatest([
      this.banco$,
      this.clinicasFirestore$,
    ]).pipe(

      map(
        ([
          banco,
          clinicasFirestore,
        ]) => {

          const idsFirestore =
            new Set(
              clinicasFirestore.map(
                (clinica) =>
                  clinica.id
              )
            );


          const clinicasJsonSemDuplicados =
            banco.clinicas.filter(
              (clinica) =>
                !idsFirestore.has(
                  clinica.id
                )
            );


          return [
            ...clinicasJsonSemDuplicados,
            ...clinicasFirestore,
          ];
        }
      )
    );
  }


  listarClinicaPorSlug(
    slug: string
  ):
    Observable<Clinica | undefined> {

    return this.listarClinicas().pipe(

      map(
        (clinicas) =>
          clinicas.find(
            (clinica) =>
              clinica.slug === slug
          )
      )
    );
  }


  buscarClinicaPorSlug(
    slug: string
  ):
    Observable<Clinica | undefined> {

    return this.listarClinicaPorSlug(
      slug
    );
  }


  listarServicosPorClinica(
    clinicaId: string
  ):
    Observable<Servico[]> {

    return combineLatest([

      this.banco$.pipe(
        map((banco) =>
          banco.servicos.filter(
            (servico) =>
              servico.clinicaId ===
              clinicaId
          )
        )
      ),

      this.servicosFirestore$.pipe(
        map((servicos) =>
          servicos.filter(
            (servico) =>
              servico.clinicaId ===
              clinicaId
          )
        )
      ),

    ]).pipe(

      map(
        ([
          servicosJson,
          servicosFirestore,
        ]) => {

          const idsFirestore =
            new Set(
              servicosFirestore.map(
                (servico) =>
                  servico.id
              )
            );


          const servicosJsonSemDuplicados =
            servicosJson.filter(
              (servico) =>
                !idsFirestore.has(
                  servico.id
                )
            );


          return [
            ...servicosJsonSemDuplicados,
            ...servicosFirestore,
          ];
        }
      )
    );
  }


  listarServicosComClinica():
    Observable<ServicoComClinica[]> {

    return combineLatest([
      this.listarClinicas(),
      this.banco$,
      this.servicosFirestore$,
    ]).pipe(

      map(
        ([
          clinicas,
          banco,
          servicosFirestore,
        ]) => {

          const servicosJson =
            banco.servicos;


          const idsFirestore =
            new Set(
              servicosFirestore.map(
                (servico) =>
                  servico.id
              )
            );


          const servicosJsonSemDuplicados =
            servicosJson.filter(
              (servico) =>
                !idsFirestore.has(
                  servico.id
                )
            );


          const todosServicos = [
            ...servicosJsonSemDuplicados,
            ...servicosFirestore,
          ];


          return todosServicos

            .map((servico) => {

              const clinica =
                clinicas.find(
                  (item) =>
                    item.id ===
                    servico.clinicaId
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
        }
      )
    );
  }


  listarMedicosPorClinica(
    clinicaId: string
  ):
    Observable<Medico[]> {

    return combineLatest([

      this.banco$.pipe(
        map((banco) =>
          banco.medicos.filter(
            (medico) =>
              medico.clinicaId ===
              clinicaId
          )
        )
      ),

      this.medicosFirestore$.pipe(
        map((medicos) =>
          medicos.filter(
            (medico) =>
              medico.clinicaId ===
              clinicaId
          )
        )
      ),

    ]).pipe(

      map(
        ([
          medicosJson,
          medicosFirestore,
        ]) => {

          const idsFirestore =
            new Set(
              medicosFirestore.map(
                (medico) =>
                  medico.id
              )
            );


          const medicosJsonSemDuplicados =
            medicosJson.filter(
              (medico) =>
                !idsFirestore.has(
                  medico.id
                )
            );


          return [
            ...medicosJsonSemDuplicados,
            ...medicosFirestore,
          ];
        }
      )
    );
  }


  listarHorariosPorClinica(
    clinicaId: string
  ):
    Observable<Horario[]> {

    return combineLatest([

      this.banco$.pipe(
        map((banco) =>
          (banco.horarios ?? []).filter(
            (horario) =>
              horario.clinicaId ===
              clinicaId
          )
        )
      ),

      this.horariosFirestore$.pipe(
        map((horarios) =>
          horarios.filter(
            (horario) =>
              horario.clinicaId ===
              clinicaId
          )
        )
      ),

    ]).pipe(

      map(
        ([
          horariosJson,
          horariosFirestore,
        ]) => {

          const idsFirestore =
            new Set(
              horariosFirestore.map(
                (horario) =>
                  horario.id
              )
            );


          const horariosJsonSemDuplicados =
            horariosJson.filter(
              (horario) =>
                !idsFirestore.has(
                  horario.id
                )
            );


          return [
            ...horariosJsonSemDuplicados,
            ...horariosFirestore,
          ].sort(
            (a, b) =>
              a.diaSemana -
              b.diaSemana
          );
        }
      )
    );
  }
}