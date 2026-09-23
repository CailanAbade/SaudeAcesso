import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import {
  Router,
  RouterLink,
} from '@angular/router';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Medico } from '../../nucleo/modelos/medico.model';

@Component({
  selector: 'app-profissionais',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './profissionais.html',
  styleUrl: './profissionais.css',
})
export class Profissionais {
  private construtorFormulario =
    inject(FormBuilder);

  private autenticacao =
    inject(Autenticacao);

  private catalogo =
    inject(Catalogo);

  private firestore =
    inject(Firestore);

  private roteador =
    inject(Router);

  profissionais =
    signal<Medico[]>([]);

  carregando =
    signal(true);

  salvando =
    signal(false);

  mensagemErro =
    signal<string | null>(null);

  formularioAberto =
    signal(false);

  profissionalEditando =
    signal<Medico | null>(null);

  formulario =
    this.construtorFormulario.group({
      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
        ],
      ],

      especialidadeId: [
        '',
        Validators.required,
      ],

      crm: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
        ],
      ],

      foto: [''],
    });

  private clinicaIdCarregada =
    signal<string | null>(null);

  constructor() {
    effect(() => {
      const carregandoSessao =
        this.autenticacao.carregandoSessao();

      if (carregandoSessao) {
        return;
      }

      const usuario =
        this.autenticacao.usuarioAtual();

      if (
        !usuario ||
        usuario.tipo !== 'clinica' ||
        !usuario.clinicaId
      ) {
        this.roteador.navigate([
          '/inicio',
        ]);

        return;
      }

      if (
        this.clinicaIdCarregada() ===
        usuario.clinicaId
      ) {
        return;
      }

      this.clinicaIdCarregada.set(
        usuario.clinicaId
      );

      this.carregarProfissionais(
        usuario.clinicaId
      );
    });
  }

  private carregarProfissionais(
    clinicaId: string
  ): void {
    this.carregando.set(true);
    this.mensagemErro.set(null);

    this.catalogo
      .listarMedicosPorClinica(
        clinicaId
      )
      .subscribe({
        next: (profissionais) => {
          this.profissionais.set(
            profissionais
          );

          this.carregando.set(false);
        },

        error: (erro) => {
          console.error(
            'Erro ao carregar profissionais:',
            erro
          );

          this.mensagemErro.set(
            'Não foi possível carregar os profissionais.'
          );

          this.carregando.set(false);
        },
      });
  }

  abrirCadastro(): void {
    this.profissionalEditando.set(
      null
    );

    this.formulario.reset({
      nome: '',
      especialidadeId: '',
      crm: '',
      foto: '',
    });

    this.mensagemErro.set(null);
    this.formularioAberto.set(true);
  }

  editar(
    profissional: Medico
  ): void {
    this.profissionalEditando.set(
      profissional
    );

    this.formulario.patchValue({
      nome: profissional.nome,
      especialidadeId:
        profissional.especialidadeId,
      crm: profissional.crm,
      foto: profissional.foto ?? '',
    });

    this.mensagemErro.set(null);
    this.formularioAberto.set(true);
  }

  cancelar(): void {
    this.formularioAberto.set(false);
    this.profissionalEditando.set(
      null
    );

    this.formulario.reset();
    this.mensagemErro.set(null);
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const usuario =
      this.autenticacao.usuarioAtual();

    if (
      !usuario ||
      usuario.tipo !== 'clinica' ||
      !usuario.clinicaId
    ) {
      this.mensagemErro.set(
        'Não foi possível identificar a clínica da sua conta.'
      );

      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(null);

    const dados = {
      clinicaId:
        usuario.clinicaId,

      nome:
        this.formulario.controls.nome.value!.trim(),

      especialidadeId:
        this.formulario.controls
          .especialidadeId.value!,

      crm:
        this.formulario.controls.crm.value!.trim(),

      foto:
        this.formulario.controls.foto.value?.trim() ?? '',
    };

    try {
      const profissional =
        this.profissionalEditando();

      if (profissional) {
        const referencia = doc(
          this.firestore,
          'medicos',
          profissional.id
        );

        await updateDoc(
          referencia,
          dados
        );

        this.profissionais.update(
          (lista) =>
            lista.map((item) =>
              item.id === profissional.id
                ? {
                    ...item,
                    ...dados,
                  }
                : item
            )
        );
      } else {
        const referencia =
          await addDoc(
            collection(
              this.firestore,
              'medicos'
            ),
            dados
          );

        this.profissionais.update(
          (lista) => [
            ...lista,
            {
              id: referencia.id,
              ...dados,
            },
          ]
        );
      }

      this.cancelar();
    } catch (erro) {
      console.error(
        'Erro ao salvar profissional:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível salvar o profissional. Tente novamente.'
      );
    } finally {
      this.salvando.set(false);
    }
  }

  async excluir(
    profissional: Medico
  ): Promise<void> {
    const usuario =
      this.autenticacao.usuarioAtual();

    if (
      !usuario?.clinicaId ||
      usuario.clinicaId !==
        profissional.clinicaId
    ) {
      this.mensagemErro.set(
        'Você não tem permissão para excluir este profissional.'
      );

      return;
    }

    if (
      profissional.id.startsWith(
        'med-'
      )
    ) {
      window.alert(
        'Este profissional faz parte dos dados iniciais do sistema e não pode ser excluído por esta tela.'
      );

      return;
    }

    const confirmou =
      window.confirm(
        `Tem certeza que deseja excluir "${profissional.nome}"?\n\nEssa ação não pode ser desfeita.`
      );

    if (!confirmou) {
      return;
    }

    this.mensagemErro.set(null);

    try {
      await deleteDoc(
        doc(
          this.firestore,
          'medicos',
          profissional.id
        )
      );

      this.profissionais.update(
        (lista) =>
          lista.filter(
            (item) =>
              item.id !== profissional.id
          )
      );
    } catch (erro) {
      console.error(
        'Erro ao excluir profissional:',
        erro
      );

      this.mensagemErro.set(
        'Não foi possível excluir o profissional.'
      );
    }
  }

  nomeEspecialidade(
    especialidadeId: string
  ): string {
    const especialidades: Record<
      string,
      string
    > = {
      'cat-clinico-geral':
        'Clínico Geral',

      'cat-cardiologia':
        'Cardiologia',

      'cat-ginecologia':
        'Ginecologia',

      'cat-pediatria':
        'Pediatria',

      'cat-exame-laboratorial':
        'Exames Laboratoriais',

      'cat-exame-imagem':
        'Exames de Imagem',
    };

    return (
      especialidades[
        especialidadeId
      ] ?? especialidadeId
    );
  }
}