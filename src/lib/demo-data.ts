import type { Vendedor, Venda, Configuracoes } from "@/types"

export const DEMO_CONFIGURACOES: Configuracoes = {
  nomeProprietario: "João Murilo",
}

export const DEMO_VENDEDORES: Vendedor[] = [
  {
    id: "v1",
    nome: "João Silva",
    createdAt: "2026-01-15T10:00:00.000Z",
    despachanteEnabled: true,
    percentualVendedor: 20,
    percentualProprietario: 10,
  },
  {
    id: "v2",
    nome: "Raiza Santos",
    createdAt: "2026-02-20T10:00:00.000Z",
    despachanteEnabled: true,
    percentualVendedor: 15,
    percentualProprietario: 15,
  },
  {
    id: "v3",
    nome: "Carlos Oliveira",
    createdAt: "2026-03-10T10:00:00.000Z",
    despachanteEnabled: false,
    percentualVendedor: 25,
    percentualProprietario: 15,
  },
]

export const DEMO_VENDAS: Venda[] = [
  // João - 5 vendas
  {
    id: "ve1",
    vendedorId: "v1",
    valor: 20000,
    data: "2026-04-05T10:00:00.000Z",
    descricao: "Mentoria Premium",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
  },
  {
    id: "ve2",
    vendedorId: "v1",
    valor: 15000,
    data: "2026-05-12T10:00:00.000Z",
    descricao: "Consultoria Financeira",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
  },
  {
    id: "ve3",
    vendedorId: "v1",
    valor: 35000,
    data: "2026-06-01T10:00:00.000Z",
    descricao: "Programa Avançado",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
  },
  {
    id: "ve4",
    vendedorId: "v1",
    valor: 8000,
    data: "2026-07-18T10:00:00.000Z",
    descricao: "Aula Particular",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
  },
  {
    id: "ve5",
    vendedorId: "v1",
    valor: 22000,
    data: "2026-08-10T10:00:00.000Z",
    descricao: "Mentoria Executiva",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
  },
  // Raiza - 3 vendas
  {
    id: "ve6",
    vendedorId: "v2",
    valor: 12000,
    data: "2026-05-20T10:00:00.000Z",
    descricao: "Coaching Individual",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 },
  },
  {
    id: "ve7",
    vendedorId: "v2",
    valor: 28000,
    data: "2026-06-15T10:00:00.000Z",
    descricao: "Grupo VIP",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 },
  },
  {
    id: "ve8",
    vendedorId: "v2",
    valor: 18500,
    data: "2026-08-01T10:00:00.000Z",
    descricao: "Workshop Premium",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 },
  },
  // Carlos - 4 vendas
  {
    id: "ve9",
    vendedorId: "v3",
    valor: 45000,
    data: "2026-04-22T10:00:00.000Z",
    descricao: "Projeto Grande",
    distribuicao: { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 },
  },
  {
    id: "ve10",
    vendedorId: "v3",
    valor: 10000,
    data: "2026-06-30T10:00:00.000Z",
    descricao: "Consultoria Básica",
    distribuicao: { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 },
  },
  {
    id: "ve11",
    vendedorId: "v3",
    valor: 32000,
    data: "2026-07-25T10:00:00.000Z",
    descricao: "Mentoria Corporativa",
    distribuicao: { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 },
  },
  {
    id: "ve12",
    vendedorId: "v3",
    valor: 25000,
    data: "2026-08-20T10:00:00.000Z",
    descricao: "Treinamento Equipe",
    distribuicao: { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 },
  },
]

export function loadDemoData(): void {
  localStorage.setItem("crm_configuracoes", JSON.stringify(DEMO_CONFIGURACOES))
  localStorage.setItem("crm_vendedores", JSON.stringify(DEMO_VENDEDORES))
  localStorage.setItem("crm_vendas", JSON.stringify(DEMO_VENDAS))
}
