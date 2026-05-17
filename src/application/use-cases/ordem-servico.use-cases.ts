import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdemServicoRepository } from '../../infrastructure/database/repositories/ordem-servico.repository';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';
import { OrdemServico } from '../../domain/entities/ordem-servico.entity';
import { CriarOsDto } from '../dtos/ordem-servico.dto';
import { OS_EVENTS, OsCriadaEvent, OrcamentoGeradoEvent, ExecucaoFinalizadaEvent, PagamentoConfirmadoEvent } from '../../domain/events/saga.events.js';

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

  async processarOrcamentoGerado(evento: OrcamentoGeradoEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;

    // Transição correta: ABERTA → EM_ORCAMENTO → AGUARDANDO_APROVACAO
    if (os.status === 'ABERTA') {
      os.enviarParaOrcamento();
    }
    os.aguardarAprovacao(evento.valorOrcamento);
    await this.repository.atualizarStatus(os.id, os.status, {
      valorOrcamento: os.valorOrcamento,
    });
  }

  async aprovarOrcamento(id: string): Promise<OrdemServico> {
    const os = await this.buscarPorId(id);

    // Permite aprovar tanto de AGUARDANDO_APROVACAO quanto de ABERTA (fallback)
    if (os.status === 'ABERTA') {
      os.enviarParaOrcamento();
      os.aguardarAprovacao(os.valorOrcamento ?? 0);
    }
    os.aprovar();
    await this.repository.atualizarStatus(os.id, os.status);
    await this.messaging.publicar(OS_EVENTS.OS_APROVADA, { osId: os.id });
    return os;
  }

  async processarExecucaoFinalizada(evento: ExecucaoFinalizadaEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;
    if (os.status === 'APROVADA') os.iniciarExecucao();
    os.concluir();
    await this.repository.atualizarStatus(os.id, os.status);
  }

  async processarPagamentoConfirmado(evento: PagamentoConfirmadoEvent): Promise<void> {
    const os = await this.repository.buscarPorId(evento.osId);
    if (!os) return;
    if (os.status !== 'CONCLUIDA') {
      if (os.status === 'APROVADA') os.iniciarExecucao();
      if (os.status === 'EM_EXECUCAO') os.concluir();
    }
    await this.repository.atualizarStatus(os.id, os.status);
    await this.messaging.publicar(OS_EVENTS.OS_CONCLUIDA, { osId: os.id });
  }

  async cancelarOs(id: string, motivo: string): Promise<void> {
    const os = await this.repository.buscarPorId(id);
    if (!os) return;
    os.cancelar(motivo);
    await this.repository.atualizarStatus(os.id, os.status, { observacoes: motivo });
    await this.messaging.publicar(OS_EVENTS.OS_CANCELADA, { osId: id, motivo });
  }
}
