import {
  Controller, Get, Post, Put, Param, Body,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdemServicoUseCases } from '../../application/use-cases/ordem-servico.use-cases';
import { CriarOsDto } from '../../application/dtos/ordem-servico.dto';

@ApiTags('Ordens de Serviço')
@Controller('api/v1/ordens-servico')
export class OrdemServicoController {
  constructor(private readonly useCases: OrdemServicoUseCases) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir nova Ordem de Serviço' })
  async criar(@Body() dto: CriarOsDto) {
    return this.useCases.criarOs(dto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'os-service', timestamp: new Date() };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Serviço' })
  async listar() {
    return this.useCases.listarTodas();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar OS por ID' })
  async buscar(@Param('id') id: string) {
    return this.useCases.buscarPorId(id);
  }

  @Put(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar orçamento da OS' })
  async aprovar(@Param('id') id: string) {
    return this.useCases.aprovarOrcamento(id);
  }

  @Put(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar OS' })
  async cancelar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
  ) {
    await this.useCases.cancelarOs(id, motivo ?? 'Cancelado manualmente');
    return { message: 'OS cancelada' };
  }
}
