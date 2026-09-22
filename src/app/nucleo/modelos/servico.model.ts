export interface Servico {
  id: string;
  clinicaId: string;
  nome: string;
  categoriaId: string;
  precoTabela: number;
  precoApp: number;
  status: 'ativo' | 'inativo';
}