import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StatusOS {
  ABERTA = 'ABERTA',
  EM_ORCAMENTO = 'EM_ORCAMENTO',
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO',
  APROVADA = 'APROVADA',
  EM_EXECUCAO = 'EM_EXECUCAO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

@Entity('ordens_servico')
export class OrdemServicoORM {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_nome' })
  clienteNome: string;

  @Column({ name: 'cliente_cpf', length: 11 })
  clienteCpf: string;

  @Column({ name: 'veiculo_placa', length: 8 })
  veiculoPlaca: string;

  @Column({ name: 'veiculo_modelo' })
  veiculoModelo: string;

  @Column({ name: 'descricao_problema', type: 'text' })
  descricaoProblema: string;

  @Column({ type: 'enum', enum: StatusOS, default: StatusOS.ABERTA })
  status: StatusOS;

  @Column({ name: 'valor_orcamento', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorOrcamento?: number;

  @Column({ type: 'text', nullable: true })
  observacoes?: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
