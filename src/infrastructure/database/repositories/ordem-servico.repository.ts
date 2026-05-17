import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdemServicoORM } from '../entities/ordem-servico.orm-entity';
import { OrdemServico, StatusOS } from '../../../domain/entities/ordem-servico.entity';

@Injectable()
export class OrdemServicoRepository {
  constructor(
    @InjectRepository(OrdemServicoORM)
    private readonly repo: Repository<OrdemServicoORM>,
  ) {}

  async salvar(os: OrdemServico): Promise<OrdemServico> {
    const orm = this.repo.create(os);
    const salvo = await this.repo.save(orm);
    return this.toEntity(salvo);
  }

  async buscarPorId(id: string): Promise<OrdemServico | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? this.toEntity(orm) : null;
  }

  async listarTodos(): Promise<OrdemServico[]> {
    const orms = await this.repo.find({ order: { criadoEm: 'DESC' } });
    return orms.map(this.toEntity);
  }

  async atualizarStatus(id: string, status: StatusOS, extras?: Partial<OrdemServico>): Promise<void> {
    await this.repo.update(id, { status, ...extras });
  }

  private toEntity(orm: OrdemServicoORM): OrdemServico {
    return new OrdemServico({
      id: orm.id,
      clienteNome: orm.clienteNome,
      clienteCpf: orm.clienteCpf,
      veiculoPlaca: orm.veiculoPlaca,
      veiculoModelo: orm.veiculoModelo,
      descricaoProblema: orm.descricaoProblema,
      status: orm.status,
      valorOrcamento: orm.valorOrcamento,
      observacoes: orm.observacoes,
      criadoEm: orm.criadoEm,
      atualizadoEm: orm.atualizadoEm,
    });
  }
}
