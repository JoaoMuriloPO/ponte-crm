import { describe, it, expect } from "vitest"
import {
  getDistributionPercentages,
  validateDistribution,
  getDistributionTotal,
  calculateSaleValues,
  calculateSale,
  calculateDashboardTotals,
  calculateSellerTotals,
  calculateReport,
} from "@/utils/calculations"
import type { Vendedor, Venda } from "@/types"

function makeVendedor(overrides: Partial<Vendedor> = {}): Vendedor {
  return {
    id: "v1",
    nome: "João",
    createdAt: "2025-01-01T00:00:00.000Z",
    despachanteEnabled: true,
    percentualVendedor: 20,
    percentualProprietario: 10,
    ...overrides,
  }
}

function makeVenda(overrides: Partial<Venda> = {}): Venda {
  return {
    id: "sale1",
    vendedorId: "v1",
    valor: 1000,
    data: "2025-06-15T12:00:00.000Z",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
    ...overrides,
  }
}

describe("getDistributionPercentages", () => {
  it("returns correct percentages with despachante enabled", () => {
    const v = makeVendedor({ despachanteEnabled: true, percentualVendedor: 20, percentualProprietario: 10 })
    const dist = getDistributionPercentages(v)
    expect(dist).toEqual({ empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 })
  })

  it("returns 0 for despachante when disabled", () => {
    const v = makeVendedor({ despachanteEnabled: false, percentualVendedor: 25, percentualProprietario: 15 })
    const dist = getDistributionPercentages(v)
    expect(dist.despachante).toBe(0)
    expect(dist.empresa).toBe(60)
    expect(dist.vendedor).toBe(25)
    expect(dist.proprietario).toBe(15)
  })
})

describe("validateDistribution", () => {
  it("returns true when percentages sum to 100", () => {
    const v = makeVendedor({ despachanteEnabled: true, percentualVendedor: 20, percentualProprietario: 10 })
    expect(validateDistribution(v)).toBe(true)
  })

  it("returns false when percentages don't sum to 100", () => {
    const v = makeVendedor({ despachanteEnabled: true, percentualVendedor: 15, percentualProprietario: 10 })
    expect(validateDistribution(v)).toBe(false)
  })

  it("returns true without despachante when remaining is filled", () => {
    const v = makeVendedor({ despachanteEnabled: false, percentualVendedor: 25, percentualProprietario: 15 })
    expect(validateDistribution(v)).toBe(true)
  })
})

describe("getDistributionTotal", () => {
  it("sums all percentages", () => {
    const v = makeVendedor({ despachanteEnabled: true, percentualVendedor: 20, percentualProprietario: 10 })
    expect(getDistributionTotal(v)).toBe(100)
  })
})

describe("calculateSaleValues", () => {
  it("distributes 1000 correctly with despachante", () => {
    const dist = { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 }
    const result = calculateSaleValues(1000, dist)
    expect(result.valorEmpresa).toBe(600)
    expect(result.valorDespachante).toBe(100)
    expect(result.valorVendedor).toBe(200)
    expect(result.valorProprietario).toBe(100)
  })

  it("distributes 0 when despachante is 0", () => {
    const dist = { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 }
    const result = calculateSaleValues(1000, dist)
    expect(result.valorEmpresa).toBe(600)
    expect(result.valorDespachante).toBe(0)
    expect(result.valorVendedor).toBe(250)
    expect(result.valorProprietario).toBe(150)
  })

  it("handles decimal values", () => {
    const dist = { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 }
    const result = calculateSaleValues(333.33, dist)
    expect(result.valorEmpresa + result.valorDespachante + result.valorVendedor + result.valorProprietario)
      .toBeCloseTo(333.33, 2)
  })
})

describe("calculateSale", () => {
  it("returns sale calculation with venda reference", () => {
    const venda = makeVenda({ valor: 500 })
    const calc = calculateSale(venda)
    expect(calc.venda).toBe(venda)
    expect(calc.valorEmpresa).toBe(300)
    expect(calc.valorDespachante).toBe(50)
    expect(calc.valorVendedor).toBe(100)
    expect(calc.valorProprietario).toBe(50)
  })
})

describe("calculateDashboardTotals", () => {
  it("aggregates multiple sales correctly", () => {
    const v1 = makeVendedor()
    const v2 = makeVendedor({ id: "v2", percentualVendedor: 25, percentualProprietario: 15 })
    const vendas = [
      makeVenda({ valor: 1000 }),
      makeVenda({ id: "sale2", vendedorId: "v2", valor: 2000, distribuicao: { empresa: 60, despachante: 0, vendedor: 25, proprietario: 15 } }),
    ]
    const result = calculateDashboardTotals(vendas, [v1, v2])
    expect(result.totalVendido).toBe(3000)
    expect(result.quantidadeVendas).toBe(2)
    expect(result.quantidadePontes).toBe(2)
    expect(result.totalEmpresa).toBe(1800) // 600 + 1200
  })

  it("returns zeros for empty sales", () => {
    const result = calculateDashboardTotals([], [])
    expect(result.totalVendido).toBe(0)
    expect(result.quantidadeVendas).toBe(0)
  })
})

describe("calculateSellerTotals", () => {
  it("totals sales for a single seller", () => {
    const v = makeVendedor()
    const vendas = [
      makeVenda({ valor: 1000 }),
      makeVenda({ id: "sale2", valor: 500 }),
    ]
    const result = calculateSellerTotals(v, vendas)
    expect(result.totalVendido).toBe(1500)
    expect(result.quantidadeVendas).toBe(2)
    expect(result.totalVendedor).toBe(300) // 20% of 1500
    expect(result.totalProprietario).toBe(150) // 10% of 1500
    expect(result.totalEmpresa).toBe(900) // 60% of 1500
    expect(result.totalDespachante).toBe(150) // 10% of 1500
  })

  it("returns zeros for no sales", () => {
    const v = makeVendedor()
    const result = calculateSellerTotals(v, [])
    expect(result.totalVendido).toBe(0)
    expect(result.quantidadeVendas).toBe(0)
  })
})

describe("calculateReport", () => {
  const vendas = [
    makeVenda({ id: "s1", valor: 1000, data: "2025-06-01T12:00:00.000Z" }),
    makeVenda({ id: "s2", valor: 2000, data: "2025-06-15T12:00:00.000Z" }),
    makeVenda({ id: "s3", valor: 500, data: "2025-07-01T12:00:00.000Z" }),
  ]

  it("returns all sales without date filters", () => {
    const result = calculateReport(vendas)
    expect(result.quantidadeVendas).toBe(3)
    expect(result.totalVendido).toBe(3500)
  })

  it("filters by dataInicio", () => {
    const result = calculateReport(vendas, "2025-06-10")
    expect(result.quantidadeVendas).toBe(2)
    expect(result.totalVendido).toBe(2500)
  })

  it("filters by dataFim", () => {
    const result = calculateReport(vendas, undefined, "2025-06-30")
    expect(result.quantidadeVendas).toBe(2)
    expect(result.totalVendido).toBe(3000)
  })

  it("filters by both dates", () => {
    const result = calculateReport(vendas, "2025-06-10", "2025-06-30")
    expect(result.quantidadeVendas).toBe(1)
    expect(result.totalVendido).toBe(2000)
  })

  it("returns sale calculations in vendas array", () => {
    const result = calculateReport(vendas)
    expect(result.vendas).toHaveLength(3)
    expect(result.vendas[0]).toHaveProperty("venda")
    expect(result.vendas[0]).toHaveProperty("valorEmpresa")
  })
})
