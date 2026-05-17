import { StatusOS } from '../../infrastructure/database/entities/ordem-servico.orm-entity';
export { StatusOS };

export class OrdemServico {
  id: string;
  clienteNome: string;
  clienteCpf: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  descricaoProblema: string;
  status: StatusOS;
  valorOrcamento?: number;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;

  constructor(partial: Partial<OrdemServico>) {
    Object.assign(this, partial);
  }

  abrir(): void {
    this.status = StatusOS.ABERTA;
    this.criadoEm = new Date();
    this.atualizadoEm = new Date();
  }

  enviarParaOrcamento(): void {
    if (this.status !== StatusOS.ABERTA) {
      throw new Error(`OS não pode ir para orçamento no status ${this.status}`);
    }
    this.status = StatusOS.EM_ORCAMENTO;
    this.atualizadoEm = new Date();
  }

  aguardarAprovacao(valorOrcamento: number): void {
    if (this.status !== StatusOS.EM_ORCAMENTO) {
      throw new Error(`OS não pode aguardar aprovação no status ${this.status}`);
    }
    this.status = StatusOS.AGUARDANDO_APROVACAO;
    this.valorOrcamento = valorOrcamento;
    this.atualizadoEm = new Date();
  }

  aprovar(): void {
    if (this.status !== StatusOS.AGUARDANDO_APROVACAO) {
      throw new Error(`OS não pode ser aprovada no status ${this.status}`);
    }
    this.status = StatusOS.APROVADA;
    this.atualizadoEm = new Date();
  }

  iniciarExecucao(): void {
    if (this.status !== StatusOS.APROVADA) {
      throw new Error(`OS não pode iniciar execução no status ${this.status}`);
    }
    this.status = StatusOS.EM_EXECUCAO;
    this.atualizadoEm = new Date();
  }

  concluir(): void {
    if (this.status !== StatusOS.EM_EXECUCAO) {
      throw new Error(`OS não pode ser concluída no status ${this.status}`);
    }
    this.status = StatusOS.CONCLUIDA;
    this.atualizadoEm = new Date();
  }

  cancelar(motivo?: string): void {
    if (this.status === StatusOS.CONCLUIDA) {
      throw new Error('OS já concluída não pode ser cancelada');
    }
    this.status = StatusOS.CANCELADA;
    this.observacoes = motivo;
    this.atualizadoEm = new Date();
  }
}
