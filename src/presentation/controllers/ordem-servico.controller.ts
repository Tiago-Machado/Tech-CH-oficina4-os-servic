import {
  Controller, Get, Post, Put, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdemServicoUseCases } from '../../application/use-cases/ordem-servico.use-cases';
import { CriarOsDto, AtualizarStatusDto } from '../../application/dtos/ordem-servico.dto';

@ApiTags('Ordens de Serviço')
@Controller('api/v1/ordens-servico')
export class OrdemServicoController {
  constructor(private readonly useCases: OrdemServicoUseCases) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir nova Ordem de Serviço' })
  @ApiResponse({ status: 201, description: 'OS criada com sucesso' })
  async criar(@Body() dto: CriarOsDto) {
    return this.useCases.criarOs(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Serviço' })
  async listar() {
    return this.useCases.listarTodas();
  }
  
   @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'os-service', timestamp: new Date() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar OS por ID' })
  async buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.useCases.buscarPorId(id);
  }

  @Put(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar orçamento da OS (cliente aprova)' })
  async aprovar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: AtualizarStatusDto,
  ) {
    return this.useCases.aprovarOrcamento(id);
  }

  @Put(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar OS (compensação manual)' })
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
  ) {
    await this.useCases.cancelarOs(id, motivo ?? 'Cancelado manualmente');
    return { message: 'OS cancelada' };
  }
}
