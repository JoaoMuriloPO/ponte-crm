import { describe, it, expect } from "vitest"
import {
  getDistributionPercentages,
  validateDistribution,
  calculateSaleValues,
  calculateSale,
  calculateDashboardTotals,
  calculateSellerTotals,
  buildCustomDistribution,
  distributionTotal,
  validateCustomDistribution,
} from "@/utils/calculations"
import { EMPRESA_PERCENTUAL, DESPACHANTE_PERCENTUAL } from "@/types"
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

describe("getDistributionPercentages", () => {
  it("inclui despachante quando habilitado", () => {
    const dist = getDistributionPercentages(makeVendedor())
    expect(dist).toEqual({
      empresa: EMPRESA_PERCENTUAL,
      despachante: DESPACHANTE_PERCENTUAL,
      vendedor: 20,
      proprietario: 10,
    })
  })

  it("zera despachante quando desabilitado", () => {
    const dist = getDistributionPercentages(
      makeVendedor({ despachanteEnabled: false })
    )
    expect(dist.despachante).toBe(0)
  })
})

describe("validateDistribution", () => {
  it("aceita distribuição que totaliza 100%", () => {
    expect(validateDistribution(makeVendedor())).toBe(true)
  })

  it("rejeita distribuição que não totaliza 100%", () => {
    expect(
      validateDistribution(makeVendedor({ percentualVendedor: 15 }))
    ).toBe(false)
  })
})

describe("calculateSaleValues", () => {
  it("calcula valores proporcionais ao percentual", () => {
    const dist = { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 }
    const values = calculateSaleValues(10000, dist)
    expect(values).toEqual({
      valorEmpresa: 6000,
      valorDespachante: 1000,
      valorVendedor: 1500,
      valorProprietario: 1500,
    })
  })
})

describe("calculateSale", () => {
  it("retorna cálculo completo com a venda", () => {
    const venda: Venda = {
      id: "s1",
      vendedorId: "v1",
      valor: 1000,
      data: "2025-01-01T00:00:00.000Z",
      distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
    }
    const calc = calculateSale(venda)
    expect(calc.venda).toEqual(venda)
    expect(calc.valorProprietario).toBe(100)
  })
})

describe("calculateDashboardTotals", () => {
  it("soma todos os totais", () => {
    const vendas: Venda[] = [
      {
        id: "s1",
        vendedorId: "v1",
        valor: 10000,
        data: "2025-01-01T00:00:00.000Z",
        distribuicao: { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 },
      },
    ]
    const totals = calculateDashboardTotals(vendas, [makeVendedor()])
    expect(totals.totalVendido).toBe(10000)
    expect(totals.totalEmpresa).toBe(6000)
    expect(totals.totalDespachante).toBe(1000)
    expect(totals.totalPontes).toBe(1500)
    expect(totals.totalProprietario).toBe(1500)
    expect(totals.quantidadeVendas).toBe(1)
    expect(totals.quantidadePontes).toBe(1)
  })
})

describe("calculateSellerTotals", () => {
  it("soma totais por vendedor", () => {
    const vendedor = makeVendedor()
    const vendas: Venda[] = [
      {
        id: "s1",
        vendedorId: "v1",
        valor: 10000,
        data: "2025-01-01T00:00:00.000Z",
        distribuicao: { empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 },
      },
    ]
    const totals = calculateSellerTotals(vendedor, vendas)
    expect(totals.totalVendido).toBe(10000)
    expect(totals.totalVendedor).toBe(1500)
    expect(totals.totalProprietario).toBe(1500)
  })
})

describe("buildCustomDistribution", () => {
  const base = { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 }

  it("mantém empresa/despachante e recalcula vendedor/proprietário", () => {
    const dist = buildCustomDistribution(base, 10000, 1500, 1500)
    expect(dist.empresa).toBe(60)
    expect(dist.despachante).toBe(10)
    expect(dist.vendedor).toBe(15)
    expect(dist.proprietario).toBe(15)
  })

  it("recalcula percentual a partir do valor informado", () => {
    const dist = buildCustomDistribution(base, 10000, 1499, 1501)
    expect(Math.abs(dist.vendedor - 14.99) < 1e-9).toBe(true)
    expect(Math.abs(dist.proprietario - 15.01) < 1e-9).toBe(true)
  })

  it("lida com valor zero sem divisão por zero", () => {
    const dist = buildCustomDistribution(base, 0, 0, 0)
    expect(dist.vendedor).toBe(0)
    expect(dist.proprietario).toBe(0)
  })
})

describe("distributionTotal", () => {
  it("soma os quatro percentuais", () => {
    expect(
      distributionTotal({ empresa: 60, despachante: 10, vendedor: 15, proprietario: 15 })
    ).toBe(100)
  })

  it("soma sem despachante", () => {
    expect(
      distributionTotal({ empresa: 60, despachante: 0, vendedor: 20, proprietario: 20 })
    ).toBe(100)
  })
})

describe("validateCustomDistribution", () => {
  const base = { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 }

  it("aceita valores que totalizam 100%", () => {
    expect(validateCustomDistribution(base, 10000, 1500, 1500)).toBe(true)
  })

  it("aceita totais dentro da precisão de centavos", () => {
    expect(validateCustomDistribution(base, 10000, 1500.01, 1499.99)).toBe(true)
  })

  it("rejeita valores que não totalizam 100%", () => {
    expect(validateCustomDistribution(base, 10000, 1499, 1500)).toBe(false)
    expect(validateCustomDistribution(base, 10000, 1400, 1500)).toBe(false)
  })

  it("valida distribuição sem despachante", () => {
    const noDespache = { ...base, despachante: 0 }
    expect(validateCustomDistribution(noDespache, 10000, 2000, 2000)).toBe(true)
    expect(validateCustomDistribution(noDespache, 10000, 1500, 1500)).toBe(false)
  })
})