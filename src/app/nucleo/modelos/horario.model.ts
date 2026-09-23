export interface Horario {
  id: string;
  clinicaId: string;
  diaSemana: number;
  diaNome: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}