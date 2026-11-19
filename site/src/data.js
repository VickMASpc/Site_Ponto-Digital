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
    title: 'Sua empresa mais digital. Seu trabalho mais simples.',
    description: 'Criamos soluções em software para ajudar empresas a organizar processos, reduzir tarefas repetitivas e trabalhar melhor.',
    sections: [
      { title: 'Uma empresa pensada para o digital', body: 'Somos uma empresa brasileira de desenvolvimento de software B2B, com foco em soluções digitais para outras empresas.' },
      { title: 'Uma nova forma de acessar informação', body: 'O site oferece leitura local, navegação acessível e uma conversa por voz ou texto com o assistente sobre a Ponto Digital.' },
      { title: 'Conectando pessoas ao futuro', body: 'A acessibilidade faz parte da experiência dos serviços e do site. A atividade principal da empresa é o desenvolvimento de software B2B.' }
    ]
  },
  empresa: {
    title: 'Muito além do código.',
    description: 'A Ponto Digital é um projeto empresarial de desenvolvimento de software B2B, criado para aproximar negócios de ferramentas digitais úteis.',
    sections: [
      { title: 'O que fazemos', body: 'Trabalhamos com a proposta de desenvolvimento e manutenção de software para empresas, incluindo soluções SaaS sob medida.' },
      { title: 'Nossa direção', body: 'Simplificar processos, melhorar o acesso à tecnologia e oferecer experiências utilizáveis por pessoas com diferentes necessidades.' },
      { title: 'Onde estamos', body: 'A sede proposta no projeto fica na Chácara Santo Antônio, em São Paulo, Brasil. A proposta também prevê atender clientes internacionais com serviços digitais.' },
      { title: 'Projeto acadêmico', body: 'A Ponto Digital foi criada como projeto multidisciplinar de Desenvolvimento de Sistemas, documentado no relatório assinado por Victor Monteiro. O material apresenta o planejamento da empresa e uma demonstração interativa para a feira.' },
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
      { title: 'Demonstração de MVP', body: 'O projeto acadêmico prevê um MVP do tipo Mágico de Oz, com inserção manual de dados financeiros. A demonstração está no Laboratório.' },
      { title: 'Validação do MVP', body: 'A proposta é apresentar o protótipo, colher retorno com entrevistas ou questionários e avaliar utilidade, facilidade de uso e interesse. A inclusão de pessoas cegas ou com baixa visão orienta a experiência do site.' }
    ]
  },
  acessibilidade: {
    title: 'Um site para ser visto. E ouvido.',
    description: 'A experiência é construída com navegação sem mouse, leitura por voz, alto contraste, ampliação de texto e assistente conversacional.',
    sections: [
      { title: 'Conversa sobre a empresa', body: 'No computador, a tecla J liga ou desliga o microfone. Alt mais J é uma alternativa. No celular, ative o botão Microfone do assistente. Aguarde o aviso de microfone ligado antes de falar. A conversa também aceita mensagens de texto, sem permissão de microfone.' },
      { title: 'Leitura em voz alta', body: 'Os botões de leitura usam a voz do navegador. Você também pode usar o leitor de tela para navegar por títulos, links e botões em todas as páginas.' },
      { title: 'Adaptação visual', body: 'Altere o tamanho da fonte, o contraste e o tema nas configurações. Nas preferências você também pode desligar o atalho J isolado.' },
      { title: 'Acessibilidade verificável', body: 'A interface é desenvolvida com semântica HTML, navegação por teclado, regiões de anúncio e controles com nomes acessíveis.' }
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
    description: 'Simulação de movimentações financeiras do MVP acadêmico e um espaço para conhecer a empresa pela conversa.',
    sections: [
      { title: 'Simulador financeiro', body: 'Registre receitas e despesas fictícias para ver o saldo ser recalculado instantaneamente. Os dados ficam apenas nesta sessão do navegador.' },
      { title: 'Teste a experiência por voz', body: 'Experimente perguntar quais soluções a Ponto Digital desenvolve, o que é o MVP financeiro ou quem faz parte da equipe.' }
    ]
  }
};
export function pageText(id) {
  const p = CONTENT[id];
  if (!p) return '';
  return [p.title, p.description, ...p.sections.flatMap(x => [x.title, x.body])]
    .map(text => /[.!?]$/.test(text) ? text : text + '.')
    .join(' ');
}

export function companyKnowledge() {
  return NAV.map(({id, label}) => label + '\n' + pageText(id)).join('\n\n');
}
