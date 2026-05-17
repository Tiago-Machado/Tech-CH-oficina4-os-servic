# language: pt
Funcionalidade: Gestão de Ordem de Serviço com Saga Pattern
  Como atendente da oficina mecânica
  Quero gerenciar ordens de serviço
  Para controlar o fluxo completo de atendimento ao cliente

  Cenário: Abertura de nova Ordem de Serviço
    Dado que tenho os dados de um cliente com CPF "12345678900"
    E o veículo de modelo "Honda Civic 2020" com placa "ABC1D23"
    E a descrição do problema "Motor fazendo barulho ao acelerar"
    Quando abro uma nova Ordem de Serviço
    Então a OS deve ser criada com status "ABERTA"
    E um evento "os.criada" deve ser publicado

  Cenário: Aprovação do orçamento pelo cliente
    Dado que existe uma OS com status "AGUARDANDO_APROVACAO" e orçamento de 500 reais
    Quando o cliente aprova o orçamento
    Então a OS deve ter status "APROVADA"
    E um evento "os.aprovada" deve ser publicado

  Cenário: Cancelamento de OS em qualquer etapa
    Dado que existe uma OS com status "ABERTA"
    Quando a OS é cancelada com motivo "Cliente desistiu do serviço"
    Então a OS deve ter status "CANCELADA"
    E um evento "os.cancelada" deve ser publicado

  Cenário: Fluxo completo do Saga — da abertura à conclusão
    Dado que tenho os dados de um cliente com CPF "99988877766"
    E o veículo de modelo "Toyota Corolla 2022" com placa "XYZ9W88"
    E a descrição do problema "Troca de óleo e revisão completa"
    Quando abro uma nova Ordem de Serviço
    Então a OS deve ser criada com status "ABERTA"
    Quando o orçamento de 800 reais é gerado pelo Billing Service
    Então a OS deve ter status "AGUARDANDO_APROVACAO"
    Quando o cliente aprova o orçamento
    Então a OS deve ter status "APROVADA"
