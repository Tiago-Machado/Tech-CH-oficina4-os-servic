import { Test, TestingModule } from '@nestjs/testing';
import { OrdemServicoController } from './ordem-servico.controller';
import { OrdemServicoUseCases } from '../../application/use-cases/ordem-servico.use-cases';
import { OrdemServico } from '../../domain/entities/ordem-servico.entity';
import { StatusOS } from '../../infrastructure/database/entities/ordem-servico.orm-entity';

const mockUseCases = {
  criarOs: jest.fn(),
  listarTodas: jest.fn(),
  buscarPorId: jest.fn(),
  aprovarOrcamento: jest.fn(),
  cancelarOs: jest.fn(),
};

describe('OrdemServicoController', () => {
  let controller: OrdemServicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdemServicoController],
      providers: [{ provide: OrdemServicoUseCases, useValue: mockUseCases }],
    }).compile();

    controller = module.get<OrdemServicoController>(OrdemServicoController);
    jest.clearAllMocks();
  });

  it('health() deve retornar status ok', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('os-service');
  });

  it('criar() deve chamar useCases.criarOs', async () => {
    const dto = { clienteNome: 'João', clienteCpf: '12345678900', veiculoPlaca: 'ABC1D23', veiculoModelo: 'Civic', descricaoProblema: 'Barulho' };
    const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.ABERTA });
    mockUseCases.criarOs.mockResolvedValue(os);

    const result = await controller.criar(dto as any);
    expect(mockUseCases.criarOs).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('uuid-1');
  });

  it('listar() deve retornar lista', async () => {
    mockUseCases.listarTodas.mockResolvedValue([new OrdemServico({ id: 'uuid-1' })]);
    const result = await controller.listar();
    expect(result).toHaveLength(1);
  });

  it('buscar() deve retornar OS por id', async () => {
    const os = new OrdemServico({ id: 'uuid-1' });
    mockUseCases.buscarPorId.mockResolvedValue(os);
    const result = await controller.buscar('uuid-1');
    expect(result.id).toBe('uuid-1');
  });

  it('aprovar() deve chamar aprovarOrcamento', async () => {
    const os = new OrdemServico({ id: 'uuid-1', status: StatusOS.APROVADA });
    mockUseCases.aprovarOrcamento.mockResolvedValue(os);
    const result = await controller.aprovar('uuid-1');
    expect(mockUseCases.aprovarOrcamento).toHaveBeenCalledWith('uuid-1');
    expect(result.status).toBe(StatusOS.APROVADA);
  });

  it('cancelar() deve chamar cancelarOs e retornar mensagem', async () => {
    mockUseCases.cancelarOs.mockResolvedValue(undefined);
    const result = await controller.cancelar('uuid-1', 'motivo');
    expect(mockUseCases.cancelarOs).toHaveBeenCalledWith('uuid-1', 'motivo');
    expect(result.message).toBe('OS cancelada');
  });

  it('cancelar() deve usar motivo padrão se não informado', async () => {
    mockUseCases.cancelarOs.mockResolvedValue(undefined);
    await controller.cancelar('uuid-1', undefined as any);
    expect(mockUseCases.cancelarOs).toHaveBeenCalledWith('uuid-1', 'Cancelado manualmente');
  });
});
