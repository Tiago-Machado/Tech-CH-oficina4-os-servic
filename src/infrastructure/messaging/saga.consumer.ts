import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { OrdemServicoUseCases } from '../../application/use-cases/ordem-servico.use-cases';
import {
  BILLING_EVENTS,
  EXECUCAO_EVENTS,
  OrcamentoGeradoEvent,
  PagamentoConfirmadoEvent,
  ExecucaoFinalizadaEvent,
} from '../../domain/events/saga.events';

@Injectable()
export class SagaConsumer implements OnModuleInit {
  private readonly logger = new Logger(SagaConsumer.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly useCases: OrdemServicoUseCases,
  ) {}

  async onModuleInit(): Promise<void> {
    // Aguarda RabbitMQ conectar
    await new Promise((r) => setTimeout(r, 3000));
    await this.registrarConsumers();
  }

  private async registrarConsumers(): Promise<void> {
    // Recebe orçamento gerado pelo Billing Service
    await this.messaging.assinar(
      'os-service.orcamento.gerado',
      BILLING_EVENTS.ORCAMENTO_GERADO,
      async (payload: OrcamentoGeradoEvent) => {
        this.logger.log(`Orçamento gerado para OS ${payload.osId}: R$ ${payload.valorOrcamento}`);
        await this.useCases.processarOrcamentoGerado(payload);
      },
    );

    // Recebe confirmação de pagamento
    await this.messaging.assinar(
      'os-service.pagamento.confirmado',
      BILLING_EVENTS.PAGAMENTO_CONFIRMADO,
      async (payload: PagamentoConfirmadoEvent) => {
        this.logger.log(`Pagamento confirmado para OS ${payload.osId}`);
        await this.useCases.processarPagamentoConfirmado(payload);
      },
    );

    // Compensação: pagamento falhou → cancelar OS
    await this.messaging.assinar(
      'os-service.pagamento.falhou',
      BILLING_EVENTS.PAGAMENTO_FALHOU,
      async (payload: { osId: string; motivo: string }) => {
        this.logger.warn(`Pagamento falhou para OS ${payload.osId} — cancelando`);
        await this.useCases.cancelarOs(payload.osId, `Pagamento falhou: ${payload.motivo}`);
      },
    );

    // Execução finalizada pelo Execução Service
    await this.messaging.assinar(
      'os-service.execucao.finalizada',
      EXECUCAO_EVENTS.EXECUCAO_FINALIZADA,
      async (payload: ExecucaoFinalizadaEvent) => {
        this.logger.log(`Execução finalizada para OS ${payload.osId}`);
        await this.useCases.processarExecucaoFinalizada(payload);
      },
    );

    // Compensação: execução falhou → cancelar OS
    await this.messaging.assinar(
      'os-service.execucao.falhou',
      EXECUCAO_EVENTS.EXECUCAO_FALHOU,
      async (payload: { osId: string; motivo: string }) => {
        this.logger.warn(`Execução falhou para OS ${payload.osId} — cancelando`);
        await this.useCases.cancelarOs(payload.osId, `Execução falhou: ${payload.motivo}`);
      },
    );
  }
}
