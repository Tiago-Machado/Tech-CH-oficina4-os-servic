#!/bin/bash
# setup.sh — instala todas as dependências do OS Service
set -e

echo "📦 Instalando dependências de produção..."
npm install \
  @nestjs/common \
  @nestjs/core \
  @nestjs/platform-express \
  @nestjs/typeorm \
  @nestjs/config \
  @nestjs/swagger \
  typeorm \
  pg \
  amqplib \
  class-validator \
  class-transformer \
  reflect-metadata \
  rxjs

echo "📦 Instalando dependências de desenvolvimento..."
npm install -D \
  @nestjs/cli \
  @nestjs/testing \
  @types/amqplib \
  @types/node \
  @types/pg \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/supertest

echo "✅ Dependências instaladas!"
echo ""
echo "Próximos passos:"
echo "  1. cp .env.example .env"
echo "  2. docker compose up -d postgres-os rabbitmq"
echo "  3. npm run start:dev"
