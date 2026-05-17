# OS Service — Oficina Mecânica Fase 4

Microsserviço responsável pelo gerenciamento de Ordens de Serviço (OS).

## Stack
- Node.js 20 + NestJS + TypeScript
- PostgreSQL (banco relacional)
- RabbitMQ (mensageria assíncrona)
- Clean Architecture

## Saga Pattern — Coreografado

Escolhemos o padrão coreografado (sem orquestrador central) porque:
- Elimina ponto único de falha
- Cada serviço é autônomo e desacoplado
- Rollback via eventos de compensação (os.cancelada)

### Fluxo completo

    Cliente abre OS
        publica: os.criada
    Billing gera orcamento
        publica: orcamento.gerado
    OS atualiza para AGUARDANDO_APROVACAO
        cliente aprova via PUT /ordens-servico/:id/aprovar
        publica: os.aprovada
    Execucao executa reparo
        publica: execucao.finalizada
    OS conclui

    Falha em qualquer etapa publica os.cancelada

## Eventos publicados

| Evento | Gatilho |
|---|---|
| os.criada | Nova OS aberta |
| os.aprovada | Cliente aprova orcamento |
| os.cancelada | Falha em qualquer etapa |
| os.concluida | Pagamento confirmado |

## Eventos consumidos

| Evento | Acao |
|---|---|
| orcamento.gerado | Atualiza OS para AGUARDANDO_APROVACAO |
| pagamento.confirmado | Conclui a OS |
| pagamento.falhou | Cancela a OS |
| execucao.finalizada | Registra conclusao do reparo |
| execucao.falhou | Cancela a OS |

## Endpoints

| Metodo | Rota | Descricao |
|---|---|---|
| POST | /api/v1/ordens-servico | Abrir nova OS |
| GET | /api/v1/ordens-servico | Listar todas |
| GET | /api/v1/ordens-servico/:id | Buscar por ID |
| PUT | /api/v1/ordens-servico/:id/aprovar | Aprovar orcamento |
| PUT | /api/v1/ordens-servico/:id/cancelar | Cancelar OS |
| GET | /api/v1/ordens-servico/health | Health check |

Swagger: http://localhost:3001/api/docs

## Como rodar localmente

    cp .env.example .env
    docker compose up -d postgres-os rabbitmq
    npm install
    npm run start:dev

## Testes

    npm run test:cov

| Suite | Testes | Cobertura |
|---|---|---|
| Unitarios | 35 | 96% |
| BDD Saga | 4 cenarios | ok |
| Total | 39 | 96% |

### Cenarios BDD
- Abertura de nova Ordem de Servico
- Aprovacao do orcamento pelo cliente
- Cancelamento de OS em qualquer etapa
- Fluxo completo do Saga da abertura a conclusao

## Repositorios relacionados
- Billing Service: https://github.com/Tiago-Machado/Tech-CH-oficina4-billing-service
- Execucao Service: https://github.com/Tiago-Machado/Tech-CH-oficina4-execucao-service
