import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Usuario, TipoUsuario } from '../modelos/usuario.model';

interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  cpf?: string;
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
    const credencial = await createUserWithEmailAndPassword(this.auth, dados.email, dados.senha);

    const novoUsuario: Usuario = {
      uid: credencial.user.uid,
      nome: dados.nome,
      email: dados.email,
      tipo: dados.tipo,
      cpf: dados.cpf,
      aceitouTermosEm: new Date().toISOString(),
    };

    await setDoc(doc(this.db, 'usuarios', novoUsuario.uid), novoUsuario);
    this.usuarioAtual.set(novoUsuario);
    return novoUsuario;
  }

  async entrar(email: string, senha: string): Promise<Usuario | null> {
    const credencial = await signInWithEmailAndPassword(this.auth, email, senha);
    const perfil = await this.buscarPerfil(credencial.user.uid);
    this.usuarioAtual.set(perfil);
    return perfil;
  }

  async sair(): Promise<void> {
    await signOut(this.auth);
    this.usuarioAtual.set(null);
  }

  private async buscarPerfil(uid: string): Promise<Usuario | null> {
    const referencia = doc(this.db, 'usuarios', uid);
    const retorno = await getDoc(referencia);
    return retorno.exists() ? (retorno.data() as Usuario) : null;
  }
}