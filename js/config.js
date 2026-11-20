export const CONFIG = {
  WAITLIST_ENDPOINT: 'https://formspree.io/f/SEU_CODIGO_AQUI',
  TECH_FILTERS: [
    { id: 'all', label: 'Todos' },
    { id: 'pintura', label: 'Pintura' },
    { id: 'gravura', label: 'Gravura' },
    { id: 'ceramica', label: 'Cerâmica' },
    { id: 'fotografia', label: 'Fotografia' },
    { id: '3d', label: '3D' },
    { id: 'jogos', label: 'Jogos / Game Art' },
  ],
  OP_FILTERS: [
    { id: 'all', label: 'Todos' },
    { id: 'edital', label: 'Editais' },
    { id: 'exposicao', label: 'Exposições' },
    { id: 'residencia', label: 'Residências' },
    { id: 'formacao', label: 'Formação' },
  ],
  AVAILABILITY_LABELS: {
    encomendas: { label: '🟢 Aberto a encomendas', badge: 'bg-emerald-100 text-emerald-800' },
    venda:      { label: '🏷️ Obra à venda', badge: 'bg-amber-100 text-amber-800' },
    acervo:     { label: '🔒 Apenas acervo', badge: 'bg-carcara-100 text-sertao-700' },
  },
};