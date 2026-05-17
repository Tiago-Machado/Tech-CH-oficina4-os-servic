import { OrdemServico, StatusOS } from './ordem-servico.entity';

describe('OrdemServico — Domain Entity', () => {
  const criarOsBase = () =>
    new OrdemServico({
      clienteNome: 'João Silva',
      clienteCpf: '12345678900',
      veiculoPlaca: 'ABC1D23',
      veiculoModelo: 'Honda Civic 2020',
      descricaoProblema: 'Motor barulhento',
    });

  describe('abrir()', () => {
    it('deve definir status ABERTA', () => {
      const os = criarOsBase();
      os.abrir();
      expect(os.status).toBe(StatusOS.ABERTA);
    });

    it('deve definir criadoEm', () => {
      const os = criarOsBase();
      os.abrir();
      expect(os.criadoEm).toBeInstanceOf(Date);
    });
  });

  describe('enviarParaOrcamento()', () => {
    it('deve mudar status para EM_ORCAMENTO quando ABERTA', () => {
      const os = criarOsBase();
      os.abrir();
      os.enviarParaOrcamento();
      expect(os.status).toBe(StatusOS.EM_ORCAMENTO);
    });

    it('deve lançar erro se status não for ABERTA', () => {
      const os = criarOsBase();
      os.abrir();
      os.enviarParaOrcamento();
      expect(() => os.enviarParaOrcamento()).toThrow();
    });
  });

  describe('aguardarAprovacao()', () => {
    it('deve definir valor do orçamento', () => {
      const os = criarOsBase();
      os.abrir();
      os.enviarParaOrcamento();
      os.aguardarAprovacao(1500);
      expect(os.valorOrcamento).toBe(1500);
      expect(os.status).toBe(StatusOS.AGUARDANDO_APROVACAO);
    });
  });

  describe('aprovar()', () => {
    it('deve mudar status para APROVADA', () => {
      const os = criarOsBase();
      os.abrir();
      os.enviarParaOrcamento();
      os.aguardarAprovacao(1500);
      os.aprovar();
      expect(os.status).toBe(StatusOS.APROVADA);
    });

    it('deve lançar erro se não estiver AGUARDANDO_APROVACAO', () => {
      const os = criarOsBase();
      os.abrir();
      expect(() => os.aprovar()).toThrow();
    });
  });

  describe('cancelar()', () => {
    it('deve cancelar OS em qualquer status exceto CONCLUIDA', () => {
      const os = criarOsBase();
      os.abrir();
      os.cancelar('Cliente desistiu');
      expect(os.status).toBe(StatusOS.CANCELADA);
      expect(os.observacoes).toBe('Cliente desistiu');
    });

    it('deve lançar erro ao tentar cancelar OS CONCLUIDA', () => {
      const os = criarOsBase();
      os.abrir();
      os.enviarParaOrcamento();
      os.aguardarAprovacao(1500);
      os.aprovar();
      os.iniciarExecucao();
      os.concluir();
      expect(() => os.cancelar()).toThrow();
    });
  });

  describe('fluxo completo Saga', () => {
    it('deve percorrer todos os estados válidos', () => {
      const os = criarOsBase();
      os.abrir();
      expect(os.status).toBe(StatusOS.ABERTA);
      os.enviarParaOrcamento();
      expect(os.status).toBe(StatusOS.EM_ORCAMENTO);
      os.aguardarAprovacao(2000);
      expect(os.status).toBe(StatusOS.AGUARDANDO_APROVACAO);
      os.aprovar();
      expect(os.status).toBe(StatusOS.APROVADA);
      os.iniciarExecucao();
      expect(os.status).toBe(StatusOS.EM_EXECUCAO);
      os.concluir();
      expect(os.status).toBe(StatusOS.CONCLUIDA);
    });
  });
});
