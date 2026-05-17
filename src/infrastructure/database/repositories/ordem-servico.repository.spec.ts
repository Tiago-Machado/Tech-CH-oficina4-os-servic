import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdemServicoRepository } from './ordem-servico.repository';
import { OrdemServicoORM, StatusOS } from '../entities/ordem-servico.orm-entity';
import { OrdemServico } from '../../../domain/entities/ordem-servico.entity';

const mockTypeOrmRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

describe('OrdemServicoRepository', () => {
  let repository: OrdemServicoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdemServicoRepository,
        { provide: getRepositoryToken(OrdemServicoORM), useValue: mockTypeOrmRepo },
      ],
    }).compile();

    repository = module.get<OrdemServicoRepository>(OrdemServicoRepository);
    jest.clearAllMocks();
  });

  it('salvar() deve persistir e retornar entidade', async () => {
    const os = new OrdemServico({ clienteNome: 'João', clienteCpf: '12345678900', veiculoPlaca: 'ABC1D23', veiculoModelo: 'Civic', descricaoProblema: 'Barulho', status: StatusOS.ABERTA });
    const orm = { id: 'uuid-1', ...os, criadoEm: new Date(), atualizadoEm: new Date() };
    mockTypeOrmRepo.create.mockReturnValue(orm);
    mockTypeOrmRepo.save.mockResolvedValue(orm);

    const result = await repository.salvar(os);
    expect(result).toBeInstanceOf(OrdemServico);
    expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
  });

  it('buscarPorId() deve retornar null se não encontrar', async () => {
    mockTypeOrmRepo.findOne.mockResolvedValue(null);
    const result = await repository.buscarPorId('nao-existe');
    expect(result).toBeNull();
  });

  it('buscarPorId() deve retornar entidade se encontrar', async () => {
    const orm = { id: 'uuid-1', clienteNome: 'João', clienteCpf: '12345678900', veiculoPlaca: 'ABC1D23', veiculoModelo: 'Civic', descricaoProblema: 'Barulho', status: StatusOS.ABERTA, criadoEm: new Date(), atualizadoEm: new Date() };
    mockTypeOrmRepo.findOne.mockResolvedValue(orm);
    const result = await repository.buscarPorId('uuid-1');
    expect(result).toBeInstanceOf(OrdemServico);
    expect(result?.id).toBe('uuid-1');
  });

  it('listarTodos() deve retornar lista de entidades', async () => {
    const orms = [
      { id: 'uuid-1', clienteNome: 'João', clienteCpf: '12345678900', veiculoPlaca: 'ABC1D23', veiculoModelo: 'Civic', descricaoProblema: 'Barulho', status: StatusOS.ABERTA, criadoEm: new Date(), atualizadoEm: new Date() },
    ];
    mockTypeOrmRepo.find.mockResolvedValue(orms);
    const result = await repository.listarTodos();
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(OrdemServico);
  });

  it('atualizarStatus() deve chamar update', async () => {
    mockTypeOrmRepo.update.mockResolvedValue(undefined);
    await repository.atualizarStatus('uuid-1', StatusOS.APROVADA);
    expect(mockTypeOrmRepo.update).toHaveBeenCalledWith('uuid-1', { status: StatusOS.APROVADA });
  });
});
