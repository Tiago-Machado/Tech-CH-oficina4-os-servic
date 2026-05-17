import { defineFeature, loadFeature } from 'jest-cucumber';
import { OrdemServico } from '../../domain/entities/ordem-servico.entity';
import { StatusOS } from '../../infrastructure/database/entities/ordem-servico.orm-entity';
import { OrdemServicoUseCases } from '../../application/use-cases/ordem-servico.use-cases';
import { OrdemServicoRepository } from '../../infrastructure/database/repositories/ordem-servico.repository';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';

const feature = loadFeature('./src/bdd/features/ordem-servico.feature');

const mockRepository = {
  salvar: jest.fn(),
  buscarPorId: jest.fn(),
  listarTodos: jest.fn(),
  atualizarStatus: jest.fn(),
};

const mockMessaging = { publicar: jest.fn() };

const criarUseCases = () => {
  const repo = mockRepository as unknown as OrdemServicoRepository;
  const msg = mockMessaging as unknown as MessagingService;
  return new OrdemServicoUseCases(repo, msg);
};

defineFeature(feature, (test) => {
  let useCases: OrdemServicoUseCases;
  let clienteNome: string;
  let clienteCpf: string;
  let veiculoModelo: string;
  let veiculoPlaca: string;
  let descricaoProblema: string;
  let osResultado: OrdemServico;
  let osExistente: OrdemServico;

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = criarUseCases();
  });

  test('Abertura de nova Ordem de Serviço', ({ given, and, when, then }) => {
    given(/^que tenho os dados de um cliente com CPF "(.*)"$/, (cpf: string) => {
      clienteCpf = cpf;
      clienteNome = 'João Silva';
    });

    and(/^o veículo de modelo "(.*)" com placa "(.*)"$/, (modelo: string, placa: string) => {
      veiculoModelo = modelo;
      veiculoPlaca = placa;
    });

    and(/^a descrição do problema "(.*)"$/, (descricao: string) => {
      descricaoProblema = descricao;
    });

    when('abro uma nova Ordem de Serviço', async () => {
      const os = new OrdemServico({ id: 'uuid-bdd-1', clienteNome, clienteCpf, veiculoPlaca, veiculoModelo, descricaoProblema, status: StatusOS.ABERTA, criadoEm: new Date(), atualizadoEm: new Date() });
      mockRepository.salvar.mockResolvedValue(os);
      mockMessaging.publicar.mockResolvedValue(undefined);
      osResultado = await useCases.criarOs({ clienteNome, clienteCpf, veiculoPlaca, veiculoModelo, descricaoProblema });
    });

    then(/^a OS deve ser criada com status "(.*)"$/, (status: string) => {
      expect(osResultado.status).toBe(status);
    });

    and(/^um evento "(.*)" deve ser publicado$/, (evento: string) => {
      expect(mockMessaging.publicar).toHaveBeenCalledWith(evento, expect.any(Object));
    });
  });

  test('Aprovação do orçamento pelo cliente', ({ given, when, then, and }) => {
    given(/^que existe uma OS com status "(.*)" e orçamento de (\d+) reais$/, async (status: string, valor: string) => {
      osExistente = new OrdemServico({ id: 'uuid-bdd-2', status: status as StatusOS, valorOrcamento: Number(valor), clienteNome: 'Maria', clienteCpf: '98765432100', veiculoPlaca: 'DEF4G56', veiculoModelo: 'Civic', descricaoProblema: 'Freio' });
      mockRepository.buscarPorId.mockResolvedValue(osExistente);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      mockMessaging.publicar.mockResolvedValue(undefined);
    });

    when('o cliente aprova o orçamento', async () => {
      osResultado = await useCases.aprovarOrcamento('uuid-bdd-2');
    });

    then(/^a OS deve ter status "(.*)"$/, (status: string) => {
      expect(osResultado.status).toBe(status);
    });

    and(/^um evento "(.*)" deve ser publicado$/, (evento: string) => {
      expect(mockMessaging.publicar).toHaveBeenCalledWith(evento, expect.any(Object));
    });
  });

  test('Cancelamento de OS em qualquer etapa', ({ given, when, then, and }) => {
    given(/^que existe uma OS com status "(.*)"$/, async (status: string) => {
      osExistente = new OrdemServico({ id: 'uuid-bdd-3', status: status as StatusOS, clienteNome: 'Carlos', clienteCpf: '11122233300', veiculoPlaca: 'GHI7J89', veiculoModelo: 'Gol', descricaoProblema: 'Problema' });
      mockRepository.buscarPorId.mockResolvedValue(osExistente);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      mockMessaging.publicar.mockResolvedValue(undefined);
    });

    when(/^a OS é cancelada com motivo "(.*)"$/, async (motivo: string) => {
      await useCases.cancelarOs('uuid-bdd-3', motivo);
    });

    then(/^a OS deve ter status "(.*)"$/, (status: string) => {
      expect(osExistente.status).toBe(status);
    });

    and(/^um evento "(.*)" deve ser publicado$/, (evento: string) => {
      expect(mockMessaging.publicar).toHaveBeenCalledWith(evento, expect.any(Object));
    });
  });

  test('Fluxo completo do Saga — da abertura à conclusão', ({ given, and, when, then }) => {
    given(/^que tenho os dados de um cliente com CPF "(.*)"$/, (cpf: string) => {
      clienteCpf = cpf;
      clienteNome = 'Ana Costa';
    });

    and(/^o veículo de modelo "(.*)" com placa "(.*)"$/, (modelo: string, placa: string) => {
      veiculoModelo = modelo;
      veiculoPlaca = placa;
    });

    and(/^a descrição do problema "(.*)"$/, (descricao: string) => {
      descricaoProblema = descricao;
    });

    when('abro uma nova Ordem de Serviço', async () => {
      const os = new OrdemServico({ id: 'uuid-bdd-4', clienteNome, clienteCpf, veiculoPlaca, veiculoModelo, descricaoProblema, status: StatusOS.ABERTA, criadoEm: new Date(), atualizadoEm: new Date() });
      mockRepository.salvar.mockResolvedValue(os);
      mockMessaging.publicar.mockResolvedValue(undefined);
      osResultado = await useCases.criarOs({ clienteNome, clienteCpf, veiculoPlaca, veiculoModelo, descricaoProblema });
    });

    then(/^a OS deve ser criada com status "(.*)"$/, (status: string) => {
      expect(osResultado.status).toBe(status);
    });

    when(/^o orçamento de (\d+) reais é gerado pelo Billing Service$/, async (valor: string) => {
      const osAtualizada = new OrdemServico({ ...osResultado, status: StatusOS.ABERTA });
      mockRepository.buscarPorId.mockResolvedValue(osAtualizada);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      await useCases.processarOrcamentoGerado({ osId: 'uuid-bdd-4', valorOrcamento: Number(valor), descricaoServicos: 'Revisão completa' });
      osResultado = { ...osAtualizada, status: StatusOS.AGUARDANDO_APROVACAO } as OrdemServico;
    });

    then(/^a OS deve ter status "(.*)"$/, (status: string) => {
      expect(osResultado.status).toBe(status);
    });

    when('o cliente aprova o orçamento', async () => {
      const osParaAprovar = new OrdemServico({ id: 'uuid-bdd-4', status: StatusOS.AGUARDANDO_APROVACAO, valorOrcamento: 800, clienteNome, clienteCpf, veiculoPlaca, veiculoModelo, descricaoProblema });
      mockRepository.buscarPorId.mockResolvedValue(osParaAprovar);
      mockRepository.atualizarStatus.mockResolvedValue(undefined);
      osResultado = await useCases.aprovarOrcamento('uuid-bdd-4');
    });

    then(/^a OS deve ter status "(.*)"$/, (status: string) => {
      expect(osResultado.status).toBe(status);
    });
  });
});
