export type Papel = 'CLIENTE' | 'OPERADOR';
export type StatusAssento = 'LIVRE' | 'RESERVADO' | 'VENDIDO';
export type MetodoPagamento = 'PIX' | 'CARTAO' | 'DINHEIRO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  papel: Papel;
}

export interface Filme {
  id: number;
  titulo: string;
  descricao: string | null;
  duracaoMinutos: number;
  classificacao: string;
  imagemUrl: string | null;
  ativo: boolean;
}

export interface Sala {
  id: number;
  nome: string;
  capacidade: number;
}

export interface Sessao {
  id: number;
  inicio: string;
  fim: string;
  preco: number;
  filme: {
    id: number;
    titulo: string;
    descricao: string | null;
    classificacao: string;
    duracaoMinutos: number;
    imagemUrl: string | null;
  };
  sala: { id: number; nome: string };
}

export interface AssentoMapa {
  assentoId: number;
  numero: number;
  status: StatusAssento;
}

export interface Mapa {
  sessao: Sessao;
  resumo: { capacidade: number; livres: number; reservados: number; vendidos: number };
  filas: { fila: string; assentos: AssentoMapa[] }[];
}

export interface IngressoResumo {
  codigo: string;
  status: 'VALIDO' | 'UTILIZADO';
  fila: string;
  numero: number;
}

export interface Reserva {
  id: number;
  status: 'PENDENTE' | 'PAGA' | 'EXPIRADA' | 'CANCELADA';
  canal: 'ONLINE' | 'BALCAO';
  total: number;
  expiraEm: string | null;
  criadoEm: string;
  sessao: { id: number; inicio: string; preco: number; filme: string; sala: string };
  assentos: { fila: string; numero: number }[];
  pagamento: { metodo: MetodoPagamento; valor: number; pagoEm: string } | null;
  ingressos: IngressoResumo[];
}

export interface Ingresso {
  codigo: string;
  status: 'VALIDO' | 'UTILIZADO';
  valor: number;
  emitidoEm: string;
  utilizadoEm: string | null;
  assento: string;
  fila: string;
  numero: number;
  sessao: { id: number; inicio: string; fim: string; filme: string; classificacao: string; sala: string };
}

export interface RelatorioOcupacao {
  totais: { sessoes: number; capacidade: number; vendidos: number; receita: number; taxaOcupacaoMedia: number };
  sessoes: {
    sessaoId: number;
    filme: string;
    sala: string;
    inicio: string;
    preco: number;
    capacidade: number;
    vendidos: number;
    reservados: number;
    utilizados: number;
    taxaOcupacao: number;
    receita: number;
  }[];
}

export interface RelatorioVendas {
  totais: { ingressos: number; receita: number };
  porFilme: { filmeId: number; filme: string; sessoes: number; ingressos: number; receita: number; ticketMedio: number }[];
  porMetodo: { metodo: MetodoPagamento; canal: 'ONLINE' | 'BALCAO'; pagamentos: number; receita: number }[];
}
