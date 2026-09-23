export type TipoUsuario = 'paciente' | 'clinica';

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  cpf?: string;
  cnpj?: string;
  clinicaId?: string;
  aceitouTermosEm: string;
}