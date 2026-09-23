import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
} from '@angular/fire/firestore';

import {
  Usuario,
  TipoUsuario,
} from '../modelos/usuario.model';

interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  cpf?: string;
  cnpj?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Autenticacao {
  private auth = inject(Auth);
  private db = inject(Firestore);

  usuarioAtual = signal<Usuario | null>(null);
  carregandoSessao = signal(true);

  constructor() {
    user(this.auth).subscribe(async (credencial) => {
      if (!credencial) {
        this.usuarioAtual.set(null);
        this.carregandoSessao.set(false);
        return;
      }

      const perfil = await this.buscarPerfil(credencial.uid);

      this.usuarioAtual.set(perfil);
      this.carregandoSessao.set(false);
    });
  }

  async cadastrar(dados: DadosCadastro): Promise<Usuario> {
    const credencial =
      await createUserWithEmailAndPassword(
        this.auth,
        dados.email,
        dados.senha
      );

    const uid = credencial.user.uid;

    const clinicaId =
      dados.tipo === 'clinica'
        ? `cli-${uid}`
        : undefined;

    const novoUsuario: Usuario = {
      uid,
      nome: dados.nome,
      email: dados.email,
      tipo: dados.tipo,
      ...(dados.cpf
        ? { cpf: dados.cpf }
        : {}),
      ...(dados.cnpj
        ? { cnpj: dados.cnpj }
        : {}),
      ...(clinicaId
        ? { clinicaId }
        : {}),
      aceitouTermosEm:
        new Date().toISOString(),
    };

    await setDoc(
      doc(this.db, 'usuarios', uid),
      novoUsuario
    );

    if (
      dados.tipo === 'clinica' &&
      clinicaId
    ) {
      const novaClinica = {
        id: clinicaId,
        slug: this.gerarSlug(
          dados.nome,
          uid
        ),
        nome: dados.nome,
        cnpj: dados.cnpj ?? '',
        verificada: false,
        regiaoId: 'regiao-01',
        endereco: {
          rua: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: 'BA',
        },
        avaliacao: 0,
        qtdAvaliacoes: 0,
        planoId: 'plano-basico',
      };

      await setDoc(
        doc(
          this.db,
          'clinicas',
          clinicaId
        ),
        novaClinica
      );
    }

    this.usuarioAtual.set(novoUsuario);

    return novoUsuario;
  }

  async entrar(
    email: string,
    senha: string
  ): Promise<Usuario | null> {
    const credencial =
      await signInWithEmailAndPassword(
        this.auth,
        email,
        senha
      );

    const perfil =
      await this.buscarPerfil(
        credencial.user.uid
      );

    this.usuarioAtual.set(perfil);

    return perfil;
  }

  async sair(): Promise<void> {
    await signOut(this.auth);
    this.usuarioAtual.set(null);
  }

  private async buscarPerfil(
    uid: string
  ): Promise<Usuario | null> {
    const referencia = doc(
      this.db,
      'usuarios',
      uid
    );

    const retorno =
      await getDoc(referencia);

    return retorno.exists()
      ? (retorno.data() as Usuario)
      : null;
  }

  private gerarSlug(
    nome: string,
    uid: string
  ): string {
    const nomeNormalizado =
      nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `${nomeNormalizado}-${uid.slice(0, 6)}`;
  }
}