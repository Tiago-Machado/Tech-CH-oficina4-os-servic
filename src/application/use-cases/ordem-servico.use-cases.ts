import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdemServicoRepository } from '../../infrastructure/database/repositories/ordem-servico.repository';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';
import { OrdemServico } from '../../domain/entities/ordem-servico.entity';
import { CriarOsDto } from '../dtos/ordem-servico.dto';
import { OS_EVENTS, OsCriadaEvent, OrcamentoGeradoEvent, ExecucaoFinalizadaEvent, PagamentoConfirmadoEvent } from '../../domain/events/saga.events';

@Injectable()
export class OrdemServicoUseCases {
  constructor(
    private readonly repository: OrdemServicoRepository,
    private readonly messaging: MessagingService,
  ) {}

  async criarOs(dto: CriarOsDto): Promise<OrdemServico> {
    const os = new OrdemServico({
      clienteNome: dto.clienteNome,
      clienteCpf: dto.clienteCpf,
      veiculoPlaca: dto.veiculoPlaca,
      veiculoModelo: dto.veiculoModelo,
      descricaoProblema: dto.descricaoProblema,
    });
    os.abrir();

    const salva = await this.repository.salvar(os);

    // Saga: publica evento para o Billing Service gerar orçamento
    const evento: OsCriadaEvent = {
      osId: salva.id,
      clienteNome: salva.clienteNome,
      clienteCpf: salva.clienteCpf,
      veiculoPlaca: salva.veiculoPlaca,
      veiculoModelo: salva.veiculoModelo,
      descricaoProblema: salva.descricaoProblema,
      criadoEm: salva.criadoEm,
    };
    await this.messaging.publicar(OS_EVENTS.OS_CRIADA, evento);

    return salva;
  }

  async buscarPorId(id: string): Promise<OrdemServico> {
    const os = await this.repository.buscarPorId(id);
    if (!os) throw new NotFoundException(`OS ${id} não encontrada`);
    return os;
  }

  async listarTodas(): Promise<OrdemServico[]> {
    return this.repository.listarTodos();
  }

  // Chamado quando Billing Service envia evento orcamento.gerado
  async processarOrcamentoGerado(evento: OrcamentoGeradoEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;

    os.aguardarAprovacao(evento.valorOrcamento);
    await this.repository.atualizarStatus(os.id, os.status, {
      valorOrcamento: os.valorOrcamento,
    });
  }

  // Chamado quando cliente aprova o orçamento via API
  async aprovarOrcamento(id: string): Promise<OrdemServico> {
    const os = await this.buscarPorId(id);
    os.aprovar();
    await this.repository.atualizarStatus(os.id, os.status);

    await this.messaging.publicar(OS_EVENTS.OS_APROVADA, { osId: os.id });
    return os;
  }

  // Chamado quando Execução Service finaliza
  async processarExecucaoFinalizada(evento: ExecucaoFinalizadaEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;
    os.iniciarExecucao();
    os.concluir();
    await this.repository.atualizarStatus(os.id, os.status);
  }

  // Chamado quando pagamento é confirmado pelo Billing Service
  async processarPagamentoConfirmado(evento: PagamentoConfirmadoEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;
    os.concluir();
    await this.repository.atualizarStatus(os.id, os.status);
    await this.messaging.publicar(OS_EVENTS.OS_CONCLUIDA, { osId: os.id });
  }

  // Compensação: cancelar OS em caso de falha em qualquer etapa
  async cancelarOs(id: string, motivo: string): Promise<void> {
    const os = await this.repository.buscarPorId(id);
    if (!os) return;
    os.cancelar(motivo);
    await this.repository.atualizarStatus(os.id, os.status, { observacoes: motivo });
    await this.messaging.publicar(OS_EVENTS.OS_CANCELADA, { osId: id, motivo });
  }
}
