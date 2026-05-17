import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdemServicoUseCases } from './ordem-servico.use-cases';
import { OrdemServicoRepository } from '../../infrastructure/database/repositories/ordem-servico.repository';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';
import { OrdemServico } from '../../domain/entities/ordem-servico.entity';
import { StatusOS } from '../../infrastructure/database/entities/ordem-servico.orm-entity';

const mockRepository = {
  salvar: jest.fn(),
  buscarPorId: jest.fn(),
  listarTodos: jest.fn(),
  atualizarStatus: jest.fn(),
};

const mockMessaging = {
  publicar: jest.fn(),
};

describe('OrdemServicoUseCases', () => {
  let useCases: OrdemServicoUseCases;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdemServicoUseCases,
        { provide: OrdemServicoRepository, useValue: mockRepository },
        { provide: MessagingService, useValue: mockMessaging },
      ],
    }).compile();

    useCases = module.get<OrdemServicoUseCases>(OrdemServicoUseCases);
    jest.clearAllMocks();
  });

  describe('criarOs()', () => {
    it('deve criar OS e publicar evento os.criada', async () => {
      const dto = {
        clienteNome: 'João',
        clienteCpf: '12345678900',
        veiculoPlaca: 'ABC1D23',
        veiculoModelo: 'Civic',
        descricaoProblema: 'Barulho',
      };

      const osSalva = new OrdemServico({ ...dto, id: 'uuid-1', status: StatusOS.ABERTA, criadoEm: new Date(), atualizadoEm: new Date() });
      mockRepository.salvar.mockResolvedValue(osSalva);
      mockMessaging.publicar.mockResolvedValue(undefined);

      const resultado = await useCases.criarOs(dto);

      expect(mockRepository.salvar).toHaveBeenCalledTimes(1);
      expect(mockMessaging.publicar).toHaveBeenCalledWith('os.criada', expect.objectContaining({ osId: 'uuid-1' }));
      expect(resultado.status).toBe(StatusOS.ABERTA);
    });
  });

  describe('buscarPorId()', () => {
    it('deve retornar OS existente', async () => {
      const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.ABERTA });
      mockRepository.buscarPorId.mockResolvedValue(os);

      const resultado = await useCases.buscarPorId('uuid-1');
      expect(resultado.id).toBe('uuid-1');
    });

    it('deve lançar NotFoundException se OS não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);
      await expect(useCases.buscarPorId('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('aprovarOrcamento()', () => {
    it('deve aprovar OS em AGUARDANDO_APROVACAO e publicar evento', async () => {
      const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.AGUARDANDO_APROVACAO, valorOrcamento: 500 });
      mockRepository.buscarPorId.mockResolvedValue(os);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      mockMessaging.publicar.mockResolvedValue(undefined);

      await useCases.aprovarOrcamento('uuid-1');

      expect(mockRepository.atualizarStatus).toHaveBeenCalledWith('uuid-1', StatusOS.APROVADA);
      expect(mockMessaging.publicar).toHaveBeenCalledWith('os.aprovada', { osId: 'uuid-1' });
    });
  });

  describe('cancelarOs()', () => {
    it('deve cancelar OS e publicar evento os.cancelada', async () => {
      const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.ABERTA });
      mockRepository.buscarPorId.mockResolvedValue(os);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      mockMessaging.publicar.mockResolvedValue(undefined);

      await useCases.cancelarOs('uuid-1', 'Cliente desistiu');

      expect(mockMessaging.publicar).toHaveBeenCalledWith('os.cancelada', expect.objectContaining({ osId: 'uuid-1' }));
    });

    it('deve ignorar silenciosamente se OS não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);
      await expect(useCases.cancelarOs('nao-existe', 'motivo')).resolves.not.toThrow();
    });
  });

  describe('listarTodas()', () => {
    it('deve retornar lista de OS', async () => {
      const lista = [new OrdemServico({ id: 'uuid-1' }), new OrdemServico({ id: 'uuid-2' })];
      mockRepository.listarTodos.mockResolvedValue(lista);

      const resultado = await useCases.listarTodas();
      expect(resultado).toHaveLength(2);
    });
  });
});

describe('OrdemServicoUseCases — fluxos adicionais', () => {
  let useCases: OrdemServicoUseCases;

  beforeEach(async () => {
    const { Test } = require('@nestjs/testing');
    const module = await Test.createTestingModule({
      providers: [
        OrdemServicoUseCases,
        { provide: OrdemServicoRepository, useValue: mockRepository },
        { provide: MessagingService, useValue: mockMessaging },
      ],
    }).compile();
    useCases = module.get(OrdemServicoUseCases);
    jest.clearAllMocks();
  });

  it('processarOrcamentoGerado() deve atualizar status para AGUARDANDO_APROVACAO', async () => {
    const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.ABERTA });
    mockRepository.buscarPorId.mockResolvedValue(os);
    mockRepository.atualizarStatus.mockResolvedValue(undefined);

    await useCases.processarOrcamentoGerado({ osId: 'uuid-1', valorOrcamento: 500, descricaoServicos: 'Reparo' });

    expect(mockRepository.atualizarStatus).toHaveBeenCalledWith(
      'uuid-1', StatusOS.AGUARDANDO_APROVACAO, { valorOrcamento: 500 }
    );
  });

  it('processarOrcamentoGerado() deve ignorar se OS não existir', async () => {
    mockRepository.buscarPorId.mockResolvedValue(null);
    await expect(useCases.processarOrcamentoGerado({ osId: 'nao-existe', valorOrcamento: 500, descricaoServicos: 'Reparo' })).resolves.not.toThrow();
  });

  it('processarExecucaoFinalizada() deve concluir OS em APROVADA', async () => {
    const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.APROVADA });
    mockRepository.buscarPorId.mockResolvedValue(os);
    mockRepository.atualizarStatus.mockResolvedValue(undefined);

    await useCases.processarExecucaoFinalizada({ osId: 'uuid-1', tecnicoResponsavel: 'Técnico' });

    expect(mockRepository.atualizarStatus).toHaveBeenCalledWith('uuid-1', StatusOS.CONCLUIDA);
  });

  it('processarExecucaoFinalizada() deve ignorar se OS não existir', async () => {
    mockRepository.buscarPorId.mockResolvedValue(null);
    await expect(useCases.processarExecucaoFinalizada({ osId: 'nao-existe', tecnicoResponsavel: 'Técnico' })).resolves.not.toThrow();
  });

  it('processarPagamentoConfirmado() deve concluir OS e publicar evento', async () => {
    const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.EM_EXECUCAO });
    mockRepository.buscarPorId.mockResolvedValue(os);
    mockRepository.atualizarStatus.mockResolvedValue(undefined);
    mockMessaging.publicar.mockResolvedValue(undefined);

    await useCases.processarPagamentoConfirmado({ osId: 'uuid-1', transacaoId: 'tx-1', valor: 500 });

    expect(mockMessaging.publicar).toHaveBeenCalledWith('os.concluida', { osId: 'uuid-1' });
  });

  it('processarPagamentoConfirmado() deve ignorar se OS não existir', async () => {
    mockRepository.buscarPorId.mockResolvedValue(null);
    await expect(useCases.processarPagamentoConfirmado({ osId: 'nao-existe', transacaoId: 'tx-1', valor: 500 })).resolves.not.toThrow();
  });
});
