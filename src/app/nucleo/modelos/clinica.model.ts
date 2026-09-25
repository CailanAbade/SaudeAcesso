export interface Endereco {

  rua: string;

  numero: string;

  bairro: string;

  cidade: string;

  estado: string;

  referencia?: string;

}

export interface Clinica {

  id: string;

  slug: string;

  nome: string;

  verificada: boolean;

  regiaoId: string;

  endereco: Endereco;

  avaliacao: number;

  qtdAvaliacoes: number;

  imagemCapa?: string;

  planoId: string;

}