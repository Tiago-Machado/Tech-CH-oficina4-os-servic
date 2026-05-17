// Eventos publicados pelo OS Service
export const OS_EVENTS = {
  OS_CRIADA: 'os.criada',
  OS_CANCELADA: 'os.cancelada',
  OS_APROVADA: 'os.aprovada',
  OS_CONCLUIDA: 'os.concluida',
} as const;

// Eventos consumidos pelo OS Service
export const BILLING_EVENTS = {
  ORCAMENTO_GERADO: 'orcamento.gerado',
  ORCAMENTO_APROVADO: 'orcamento.aprovado',
  PAGAMENTO_CONFIRMADO: 'pagamento.confirmado',
  PAGAMENTO_FALHOU: 'pagamento.falhou',
} as const;

export const EXECUCAO_EVENTS = {
  EXECUCAO_INICIADA: 'execucao.iniciada',
  EXECUCAO_FINALIZADA: 'execucao.finalizada',
  EXECUCAO_FALHOU: 'execucao.falhou',
} as const;

// Payloads dos eventos
export interface OsCriadaEvent {
  osId: string;
  clienteNome: string;
  clienteCpf: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  descricaoProblema: string;
  criadoEm: Date;
}

export interface OsCanceladaEvent {
  osId: string;
  motivo: string;
}

export interface OrcamentoGeradoEvent {
  osId: string;
  valorOrcamento: number;
  descricaoServicos: string;
}

export interface OrcamentoAprovadoEvent {
  osId: string;
}

export interface PagamentoConfirmadoEvent {
  osId: string;
  transacaoId: string;
  valor: number;
}

export interface ExecucaoFinalizadaEvent {
  osId: string;
  tecnicoResponsavel: string;
  observacoes?: string;
}
