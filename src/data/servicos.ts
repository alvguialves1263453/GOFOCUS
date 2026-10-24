export interface Servico {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  valor: number;
  prazo: string;
  observacoes?: string;
}

export const servicos: Servico[] = [
  // ── FOTOGRAFIA (valores por hora — 15 fotos editadas/h) ──
  {
    id: "fotografia-1-2h",
    nome: "Freelancer de Fotografia — 1h até 2h",
    categoria: "Fotografia",
    descricao: "1h até 2h — 15 fotos/hora — R$ 150,00/h",
    valor: 150,
    prazo: "1-2 horas",
    observacoes: "R$ 150,00/h • 15 fotos editadas por hora",
  },
  {
    id: "fotografia-3-5h",
    nome: "Freelancer de Fotografia — 3h até 5h",
    categoria: "Fotografia",
    descricao: "3h até 5h — 15 fotos/hora — R$ 140,00/h",
    valor: 140,
    prazo: "3-5 horas",
    observacoes: "R$ 140,00/h • 15 fotos editadas por hora",
  },
  {
    id: "fotografia-5h+",
    nome: "Freelancer de Fotografia — Acima de 5h",
    categoria: "Fotografia",
    descricao: "acima de 5h — 15 fotos/hora — R$ 130,00/h",
    valor: 130,
    prazo: "5+ horas",
    observacoes: "R$ 130,00/h • 15 fotos editadas por hora",
  },

  // ── STORYMAKER (valores por hora — acima de 3h: R$ 180,00/h) ──
  {
    id: "storymaker-basico",
    nome: "Storymaker — Básico",
    categoria: "Storymaker",
    descricao: "R$ 200,00/h • 1 vídeo story (até 30s) + 2 criativos. Acima de 3h: R$ 180,00/h.",
    valor: 200,
    prazo: "Por hora",
    observacoes: "R$ 200,00/h. Acima de 3h: R$ 180,00/h. Entrega: 1 vídeo story até 30s + 2 criativos por hora.",
  },
  {
    id: "storymaker-intermediario",
    nome: "Storymaker — Intermediário",
    categoria: "Storymaker",
    descricao: "R$ 280,00/h • 1 vídeo story (até 30s) + 2 criativos + 1 reels c/ roteiro (até 60s, 5 dias úteis). Acima de 3h: R$ 180,00/h.",
    valor: 280,
    prazo: "Por hora + 5 dias úteis (reels)",
    observacoes: "R$ 280,00/h. Acima de 3h: R$ 180,00/h. Entrega: 1 vídeo story até 30s + 2 criativos por hora + 1 reels em até 5 dias úteis.",
  },
  {
    id: "storymaker-avancado",
    nome: "Storymaker — Avançado",
    categoria: "Storymaker",
    descricao: "R$ 350,00/h • 2 vídeos story (até 30s) + 4 criativos + 1 reels c/ roteiro (até 60s, 5 dias úteis). Acima de 3h: R$ 180,00/h.",
    valor: 350,
    prazo: "Por hora + 5 dias úteis (reels)",
    observacoes: "R$ 350,00/h. Acima de 3h: R$ 180,00/h. Entrega: 2 vídeos story até 30s + 4 criativos por hora + 1 reels em até 5 dias úteis.",
  },

  // ── SOCIAL MEDIA (valores por entrega) ──
  {
    id: "social-media-arte-feed",
    nome: "Arte para Feed",
    categoria: "Social Media",
    descricao: "R$ 20,00 • Criação de arte personalizada para feed do Instagram.",
    valor: 20,
    prazo: "24 horas",
    observacoes: "Valor por entrega — R$ 20,00 a arte",
  },
  {
    id: "social-media-arte-story",
    nome: "Arte para Story",
    categoria: "Social Media",
    descricao: "R$ 20,00 • Criação de arte personalizada para stories do Instagram.",
    valor: 20,
    prazo: "24 horas",
    observacoes: "Valor por entrega — R$ 20,00 a arte",
  },
  {
    id: "social-media-video-story",
    nome: "Vídeo para Story (30s)",
    categoria: "Social Media",
    descricao: "R$ 70,00 • Edição de vídeo curto para stories, até 30 segundos.",
    valor: 70,
    prazo: "48 horas",
    observacoes: "Valor por entrega — R$ 70,00 o vídeo",
  },
  {
    id: "social-media-reels",
    nome: "Reels (60s)",
    categoria: "Social Media",
    descricao: "R$ 120,00 • Edição de reels com roteiro, até 60 segundos.",
    valor: 120,
    prazo: "5 dias úteis",
    observacoes: "Valor por entrega — R$ 120,00 o reels",
  },
  {
    id: "social-media-fotos",
    nome: "Fotos Avulsas",
    categoria: "Social Media",
    descricao: "R$ 10,00 • Edição de fotos avulsas para redes sociais.",
    valor: 10,
    prazo: "24 horas",
    observacoes: "Valor por foto editada — R$ 10,00 cada",
  },
  {
    id: "social-media-gerenciamento",
    nome: "Gerenciamento de Redes Sociais",
    categoria: "Social Media",
    descricao: "R$ 200,00/mês • Gestão completa com agendamento, engajamento e relatórios mensais.",
    valor: 200,
    prazo: "Mensal",
    observacoes: "R$ 200,00/mês",
  },
  {
    id: "social-media-pacote-fotos",
    nome: "Pacote de Fotos — Estabelecimento/Clientes",
    categoria: "Social Media",
    descricao: "R$ 100,00 a cada 10 fotos do estabelecimento ou clientes.",
    valor: 100,
    prazo: "A combinar",
    observacoes: "R$ 100,00 a cada 10 fotos. Ajuste a quantidade conforme o número de fotos necessárias.",
  },

  // ── TRÁFEGO PAGO (valor consultivo — depende da verba do cliente) ──
  {
    id: "trafego-pago-basico",
    nome: "Tráfego Pago — Básico",
    categoria: "Tráfego Pago",
    descricao: "R$ 250,00/mês • 1 conjunto ativo + 3 criativos estáticos. Segmentação por interesse. Relatório mensal.",
    valor: 250,
    prazo: "Mensal",
    observacoes: "Valor consultivo — ajuste conforme verba do cliente. R$ 250,00/mês (gestão). Verba de anúncios definida pela empresa.",
  },
  {
    id: "trafego-pago-intermediario",
    nome: "Tráfego Pago — Intermediário",
    categoria: "Tráfego Pago",
    descricao: "R$ 450,00/mês • Até 3 conjuntos + 5 criativos. Remarketing. Segmentação por interesse e concorrência. Relatório quinzenal.",
    valor: 450,
    prazo: "Mensal",
    observacoes: "Valor consultivo — ajuste conforme verba do cliente. R$ 450,00/mês (gestão). Verba de anúncios definida pela empresa.",
  },
  {
    id: "trafego-pago-avancado",
    nome: "Tráfego Pago — Avançado",
    categoria: "Tráfego Pago",
    descricao: "R$ 750,00/mês • Funil completo TOF/MOF/BOF. Até 8 criativos. Lookalike + CRM. Testes A/B. Relatório semanal.",
    valor: 750,
    prazo: "Mensal",
    observacoes: "Valor consultivo — ajuste conforme verba do cliente. R$ 750,00/mês (gestão). Verba de anúncios definida pela empresa.",
  },
  {
    id: "trafego-pago-premium",
    nome: "Tráfego Pago — Premium",
    categoria: "Tráfego Pago",
    descricao: "R$ 1.200,00/mês • Multicanal Meta + Google. Automação CRM. Pixel avançado. Criativos ilimitados. Relatório semanal + reunião.",
    valor: 1200,
    prazo: "Mensal",
    observacoes: "Valor consultivo — ajuste conforme verba do cliente. R$ 1.200,00/mês (gestão). Verba de anúncios definida pela empresa.",
  },

  // ── DESIGN / BRANDING ──
  {
    id: "design-identidade-visual",
    nome: "Criação de Identidade Visual",
    categoria: "Branding",
    descricao: "R$ 500,00 • Logo, paleta de cores, tipografia e manual de marca.",
    valor: 500,
    prazo: "15 dias úteis",
    observacoes: "R$ 500,00 — projeto completo de identidade visual",
  },

  // ── GRÁFICA ──
  {
    id: "grafica-arte-simples",
    nome: "Arte para Gráfica — Simples",
    categoria: "Gráfica",
    descricao: "Arte básica para cartão de visita, flyer A5 ou panfleto simples.",
    valor: 50,
    prazo: "48 horas",
    observacoes: "Apenas a arte. Produto físico consultar fornecedor.",
  },
  {
    id: "grafica-arte-basica",
    nome: "Arte para Gráfica — Básica",
    categoria: "Gráfica",
    descricao: "Arte para folder simples, banner retangular ou cardápio básico.",
    valor: 100,
    prazo: "48 horas",
    observacoes: "Apenas a arte. Produto físico consultar fornecedor.",
  },
  {
    id: "grafica-arte-intermediaria",
    nome: "Arte para Gráfica — Intermediária",
    categoria: "Gráfica",
    descricao: "Arte para banner com foto, folder dobrável ou panfleto ilustrado.",
    valor: 150,
    prazo: "72 horas",
    observacoes: "Apenas a arte. Produto físico consultar fornecedor.",
  },
  {
    id: "grafica-arte-avancada",
    nome: "Arte para Gráfica — Avançada",
    categoria: "Gráfica",
    descricao: "Arte para catálogo simples, banner grande formato ou display.",
    valor: 200,
    prazo: "5 dias úteis",
    observacoes: "Apenas a arte. Produto físico consultar fornecedor.",
  },
  {
    id: "grafica-arte-premium",
    nome: "Arte para Gráfica — Premium",
    categoria: "Gráfica",
    descricao: "Arte completa para catálogo rebuscado, embalagem personalizada ou material institucional.",
    valor: 250,
    prazo: "7 dias úteis",
    observacoes: "Apenas a arte. Produto físico consultar fornecedor.",
  },

  // ── CAPTAÇÃO ──
  {
    id: "captacao-1h",
    nome: "Captação — 1h",
    categoria: "Captação",
    descricao: "R$ 100,00/hora • 1 hora de captação.",
    valor: 100,
    prazo: "Por hora",
    observacoes: "R$ 100,00 por hora de captação.",
  },
];

export const categorias = [...new Set(servicos.map(s => s.categoria))];

export function getServicosPorCategoria(): Record<string, Servico[]> {
  const map: Record<string, Servico[]> = {};
  for (const s of servicos) {
    if (!map[s.categoria]) map[s.categoria] = [];
    map[s.categoria].push(s);
  }
  return map;
}

export function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getServicoById(id: string): Servico | undefined {
  return servicos.find(s => s.id === id);
}
