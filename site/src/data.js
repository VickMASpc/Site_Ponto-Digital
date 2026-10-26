export const NAV = [
  { id: 'inicio', label: 'Início', short: 'Início' },
  { id: 'empresa', label: 'Empresa', short: 'Empresa' },
  { id: 'solucoes', label: 'Soluções', short: 'Soluções' },
  { id: 'acessibilidade', label: 'Acessibilidade', short: 'Acessibilidade' },
  { id: 'impacto', label: 'Impacto', short: 'Impacto' },
  { id: 'laboratorio', label: 'Laboratório', short: 'Laboratório' }
];
export const CONTENT = {
  inicio: {
    title: 'Tecnologia que aproxima.',
    description: 'A Ponto Digital desenvolve soluções digitais para empresas. Este site também é uma experiência interativa de acessibilidade: você pode navegar, ouvir e conversar com ele.',
    sections: [
      { title: 'Uma empresa pensada para o digital', body: 'Somos uma empresa brasileira de desenvolvimento de software B2B, com foco em soluções digitais para outras empresas.' },
      { title: 'Uma nova forma de acessar informação', body: 'Nosso assistente pode apresentar os serviços, mudar páginas, ler informações e configurar recursos de acessibilidade por comando de voz.' }
    ]
  },
  empresa: {
    title: 'Muito além do código.',
    description: 'A Ponto Digital é um projeto empresarial de desenvolvimento de software B2B, criado para aproximar negócios de ferramentas digitais úteis.',
    sections: [
      { title: 'O que fazemos', body: 'Trabalhamos com a proposta de desenvolvimento e manutenção de software para empresas, incluindo soluções SaaS sob medida.' },
      { title: 'Nossa direção', body: 'Simplificar processos, melhorar o acesso à tecnologia e oferecer experiências utilizáveis por pessoas com diferentes necessidades.' },
      { title: 'Onde estamos', body: 'Nossa proposta empresarial é sediada em São Paulo, Brasil, com intenção de oferecer serviços digitais também para clientes internacionais.' },
      { title: 'Equipe do projeto', body: 'Diego Alves: direção da empresa. Gabriel Oliveira: vendas e marketing. Jonathan Vrena: gerência. Matheus Morais: desenvolvimento e marketing. Victor Monteiro: desenvolvimento chefe. Yamil Josué: apoio ao desenvolvimento. Vinicius Ferreira: apoio à gerência e vendas.' }
    ]
  },
  solucoes: {
    title: 'Soluções feitas para negócios reais.',
    description: 'Conheça a área de atuação da Ponto Digital e os conceitos de produto explorados pelo projeto.',
    sections: [
      { title: 'Desenvolvimento de software B2B', body: 'O foco principal da empresa é criar e manter aplicações que atendam processos e necessidades de outras empresas.' },
      { title: 'ERP modular — conceito', body: 'Ideia em avaliação: um sistema de gestão para microempresas, incluindo controle financeiro simplificado e estoque.' },
      { title: 'Gestão de contratos com IA — conceito', body: 'Ideia em avaliação: uma plataforma para ajudar a organizar contratos, prazos e renovações. Não é apresentada como produto já lançado.' },
      { title: 'Demonstração de MVP', body: 'O projeto acadêmico prevê um MVP do tipo Mágico de Oz, com inserção manual de dados financeiros. A demonstração está no Laboratório.' }
    ]
  },
  acessibilidade: {
    title: 'Um site para ser visto. E ouvido.',
    description: 'A experiência é construída com navegação sem mouse, leitura por voz, alto contraste, ampliação de texto e assistente conversacional.',
    sections: [
      { title: 'Navegação por voz', body: 'No computador, use a tecla J para o microfone. No celular, toque no botão de microfone fixo. É possível escolher entre modo de alternância e pressionar para falar.' },
      { title: 'Leitura em voz alta', body: 'O narrador do navegador consegue ler as informações do site mesmo quando o assistente Gemini estiver indisponível.' },
      { title: 'Adaptação visual', body: 'Altere o tamanho da fonte, o contraste e o tema nas configurações. Os recursos também podem ser alterados por comandos de voz quando o Gemini estiver conectado.' },
      { title: 'Acessibilidade verificável', body: 'A interface é desenvolvida com semântica HTML, navegação por teclado, regiões de anúncio e controles com nomes acessíveis. Não afirmamos certificação WCAG sem auditoria.' }
    ]
  },
  impacto: {
    title: 'Digitalizar também é escolher melhor.',
    description: 'O planejamento da Ponto Digital destaca a ODS 8 — Trabalho Decente e Crescimento Econômico. A digitalização também se relaciona com a ODS 12, citada em uma versão do relatório do projeto.',
    sections: [
      { title: 'ODS 8 — trabalho e crescimento', body: 'Conforme o Kanban do projeto, a prioridade é a ODS 8: Trabalho Decente e Crescimento Econômico, relacionando tecnologia à melhoria das atividades empresariais.' },
      { title: 'Digitalização e ODS 12', body: 'O relatório também menciona a ODS 12: Consumo e Produção Responsáveis. Substituir processos de papel por fluxos digitais pode reduzir materiais físicos, retrabalho e armazenamento.' },
      { title: 'Resultados dependem do contexto', body: 'Não apresentamos quantidades de árvores, água ou emissões supostamente economizadas sem metodologia e dados auditáveis.' },
      { title: 'Sustentabilidade digital', body: 'Sistemas bem projetados também devem reduzir consumo desnecessário de recursos e permanecer simples de utilizar e manter.' }
    ]
  },
  laboratorio: {
    title: 'Experimente, não apenas observe.',
    description: 'Demonstrações interativas de navegação acessível e uma simulação simples de movimentações financeiras do MVP acadêmico.',
    sections: [
      { title: 'Simulador financeiro', body: 'Registre receitas e despesas fictícias para ver o saldo ser recalculado instantaneamente. Os dados ficam apenas nesta sessão do navegador.' },
      { title: 'Teste a experiência por voz', body: 'Experimente pedir ao assistente que leia a página, navegue para soluções, aumente a fonte ou altere o modo do microfone.' }
    ]
  }
};
export function pageText(id) {
  const p = CONTENT[id];
  if (!p) return '';
  return [p.title, p.description, ...p.sections.flatMap(x => [x.title, x.body])].join('. ');
}
