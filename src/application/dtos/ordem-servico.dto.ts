import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CriarOsDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  clienteNome: string;

  @ApiProperty({ example: '12345678900' })
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/, { message: 'CPF deve conter apenas números' })
  clienteCpf: string;

  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @IsNotEmpty()
  veiculoPlaca: string;

  @ApiProperty({ example: 'Honda Civic 2020' })
  @IsString()
  @IsNotEmpty()
  veiculoModelo: string;

  @ApiProperty({ example: 'Motor fazendo barulho ao acelerar' })
  @IsString()
  @IsNotEmpty()
  descricaoProblema: string;
}

export class AtualizarStatusDto {
  @ApiProperty({ example: 'Problema identificado: correia dentada' })
  @IsString()
  observacoes?: string;
}
