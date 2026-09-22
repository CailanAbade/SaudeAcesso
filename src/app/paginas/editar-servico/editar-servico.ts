import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

import { Autenticacao } from '../../nucleo/servicos/autenticacao';
import { Catalogo } from '../../nucleo/servicos/catalogo';
import { Preco } from '../../nucleo/servicos/preco';
import { Servico } from '../../nucleo/modelos/servico.model';

@Component({
  selector: 'app-editar-servico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './editar-servico.html',
  styleUrl: './editar-servico.css',
})
export class EditarServico {
  private construtorFormulario = inject(FormBuilder);
  private autenticacao = inject(Autenticacao);
  private catalogo = inject(Catalogo);
  private preco = inject(Preco);
  private firestore = inject(Firestore);
  private rota = inject(ActivatedRoute);
  private roteador = inject(Router);

  servico = signal<Servico | null>(null);
  carregando = signal(true);
  salvando = signal(false);
  mensagemErro = signal<string | null>(null);
  mensagemSucesso = signal<string | null>(null);

  formulario = this.construtorFormulario.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', [Validators.required]],
    precoTabela: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    precoApp: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
  });

  constructor() {
    effect(() => {
      const carregandoSessao = this.autenticacao.carregandoSessao();

      if (carregandoSessao) {
        return;
      }

      const usuario = this.autenticacao.usuarioAtual();

      if (!usuario || usuario.tipo !== 'clinica' || !usuario.clinicaId) {
        this.roteador.navigate(['/inicio']);
        return;
      }

      this.carregarServico(usuario.clinicaId);
    });
  }

  private carregarServico(clinicaId: string): void {
    const id = this.rota.snapshot.paramMap.get('id');

    if (!id) {
      this.mensagemErro.set('Serviço não encontrado.');
      this.carregando.set(false);
      return;
    }

    this.catalogo.listarServicosPorClinica(clinicaId).subscribe({
      next: (servicos) => {
        const encontrado = servicos.find((item) => item.id === id);

        if (!encontrado) {
          this.mensagemErro.set(
            'Serviço não encontrado ou não pertence à sua clínica.'
          );
          this.carregando.set(false);
          return;
        }

        this.servico.set(encontrado);

        this.formulario.patchValue({
          nome: encontrado.nome,
          categoria: encontrado.categoriaId,
          precoTabela: encontrado.precoTabela,
          precoApp: encontrado.precoApp,
        });

        this.carregando.set(false);
      },
      error: (erro) => {
        console.error('Erro ao carregar serviço:', erro);
        this.mensagemErro.set('Não foi possível carregar o serviço.');
        this.carregando.set(false);
      },
    });
  }

  get precoTabela(): number {
    return Number(this.formulario.controls.precoTabela.value) || 0;
  }

  get precoApp(): number {
    return Number(this.formulario.controls.precoApp.value) || 0;
  }

  get desconto(): number {
    return this.preco.calcularDesconto(this.precoTabela, this.precoApp);
  }

  get economia(): number {
    return this.preco.calcularEconomia(this.precoTabela, this.precoApp);
  }

  formatarReal(valor: number): string {
    return this.preco.formatarReal(valor);
  }

  async salvar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const usuario = this.autenticacao.usuarioAtual();
    const servicoAtual = this.servico();

    if (
      !usuario ||
      usuario.tipo !== 'clinica' ||
      !usuario.clinicaId ||
      !servicoAtual
    ) {
      this.mensagemErro.set(
        'Não foi possível identificar o serviço ou a clínica.'
      );
      return;
    }

    if (usuario.clinicaId !== servicoAtual.clinicaId) {
      this.mensagemErro.set(
        'Você não tem permissão para editar este serviço.'
      );
      return;
    }

    if (this.precoApp > this.precoTabela) {
      this.mensagemErro.set(
        'O preço SaúdeAcesso não pode ser maior que o preço de tabela.'
      );
      return;
    }

    this.salvando.set(true);
    this.mensagemErro.set(null);
    this.mensagemSucesso.set(null);

    try {
      const referencia = doc(this.firestore, 'servicos', servicoAtual.id);

      await setDoc(
        referencia,
        {
          id: servicoAtual.id,
          clinicaId: servicoAtual.clinicaId,
          nome: this.formulario.controls.nome.value!.trim(),
          categoriaId: this.formulario.controls.categoria.value!,
          precoTabela: this.precoTabela,
          precoApp: this.precoApp,
          status: servicoAtual.status,
        },
        { merge: true }
      );

      this.mensagemSucesso.set('Serviço atualizado com sucesso!');

      setTimeout(() => {
        this.roteador.navigate(['/painel-clinica']);
      }, 700);
    } catch (erro) {
      console.error('Erro ao atualizar serviço:', erro);
      this.mensagemErro.set(
        'Não foi possível atualizar o serviço. Tente novamente.'
      );
    } finally {
      this.salvando.set(false);
    }
  }
}