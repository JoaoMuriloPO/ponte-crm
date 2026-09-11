import {
  EMPRESA_PERCENTUAL,
  DESPACHANTE_PERCENTUAL,
  type Vendedor,
  type Distribuicao,
  type Venda,
  type SaleCalculation,
  type DashboardTotals,
  type SellerTotals,
  type ReportTotals,
} from "@/types"

export function getDistributionPercentages(vendedor: Vendedor): Distribuicao {
  return {
    empresa: EMPRESA_PERCENTUAL,
    despachante: vendedor.despachanteEnabled ? DESPACHANTE_PERCENTUAL : 0,
    vendedor: vendedor.percentualVendedor,
    proprietario: vendedor.percentualProprietario,
  }
}

export function validateDistribution(vendedor: Vendedor): boolean {
  const dist = getDistributionPercentages(vendedor)
  const total = dist.empresa + dist.despachante + dist.vendedor + dist.proprietario
  return total === 100
}

export function getDistributionTotal(vendedor: Vendedor): number {
  const dist = getDistributionPercentages(vendedor)
  return dist.empresa + dist.despachante + dist.vendedor + dist.proprietario
}

export function calculateSaleValues(valor: number, dist: Distribuicao): Omit<SaleCalculation, "venda"> {
  return {
    valorEmpresa: valor * dist.empresa / 100,
    valorDespachante: valor * dist.despachante / 100,
    valorVendedor: valor * dist.vendedor / 100,
    valorProprietario: valor * dist.proprietario / 100,
  }
}

export function buildCustomDistribution(
  base: Distribuicao,
  valor: number,
  valorVendedor: number,
  valorProprietario: number
): Distribuicao {
  return {
    empresa: base.empresa,
    despachante: base.despachante,
    vendedor:
      valor > 0
        ? Math.round((valorVendedor / valor) * 100 * 100) / 100
        : 0,
    proprietario:
      valor > 0
        ? Math.round((valorProprietario / valor) * 100 * 100) / 100
        : 0,
  }
}

export function distributionTotal(dist: Distribuicao): number {
  return dist.empresa + dist.despachante + dist.vendedor + dist.proprietario
}

export function validateCustomDistribution(
  base: Distribuicao,
  valor: number,
  valorVendedor: number,
  valorProprietario: number,
  tolerance = 0.001
): boolean {
  const dist = buildCustomDistribution(base, valor, valorVendedor, valorProprietario)
  const total = Math.round(distributionTotal(dist) * 100) / 100
  return Math.abs(total - 100) <= tolerance
}

export function calculateSale(venda: Venda): SaleCalculation {
  const values = calculateSaleValues(venda.valor, venda.distribuicao)
  return {
    venda,
    ...values,
  }
}

export function calculateDashboardTotals(
  vendas: Venda[],
  vendedores: Vendedor[]
): DashboardTotals {
  let totalVendido = 0
  let totalEmpresa = 0
  let totalDespachante = 0
  let totalPontes = 0
  let totalProprietario = 0

  for (const venda of vendas) {
    const calc = calculateSale(venda)
    totalVendido += venda.valor
    totalEmpresa += calc.valorEmpresa
    totalDespachante += calc.valorDespachante
    totalPontes += calc.valorVendedor
    totalProprietario += calc.valorProprietario
  }

  return {
    totalVendido,
    quantidadeVendas: vendas.length,
    totalEmpresa,
    totalDespachante,
    totalPontes,
    totalProprietario,
    quantidadePontes: vendedores.length,
  }
}

export function calculateSellerTotals(
  vendedor: Vendedor,
  vendas: Venda[]
): SellerTotals {
  let totalVendido = 0
  let totalVendedor = 0
  let totalProprietario = 0
  let totalEmpresa = 0
  let totalDespachante = 0

  for (const venda of vendas) {
    const calc = calculateSale(venda)
    totalVendido += venda.valor
    totalVendedor += calc.valorVendedor
    totalProprietario += calc.valorProprietario
    totalEmpresa += calc.valorEmpresa
    totalDespachante += calc.valorDespachante
  }

  return {
    vendedor,
    quantidadeVendas: vendas.length,
    totalVendido,
    totalVendedor,
    totalProprietario,
    totalEmpresa,
    totalDespachante,
  }
}

export interface ReportFilters {
  dataInicio?: string
  dataFim?: string
  vendedorId?: string
  valorMin?: number
  valorMax?: number
}

export function calculateReport(
  vendas: Venda[],
  filters: ReportFilters = {}
): ReportTotals {
  const { dataInicio, dataFim, vendedorId, valorMin, valorMax } = filters
  const filteredVendas = vendas.filter((venda) => {
    const vendaDate = new Date(venda.data)
    if (dataInicio && vendaDate < new Date(dataInicio)) return false
    if (dataFim) {
      const endDate = new Date(dataFim)
      endDate.setHours(23, 59, 59, 999)
      if (vendaDate > endDate) return false
    }
    if (vendedorId && venda.vendedorId !== vendedorId) return false
    if (valorMin !== undefined && venda.valor < valorMin) return false
    if (valorMax !== undefined && venda.valor > valorMax) return false
    return true
  })

  const saleCalculations = filteredVendas.map(calculateSale)

  let totalVendido = 0
  let totalEmpresa = 0
  let totalDespachante = 0
  let totalPontes = 0
  let totalProprietario = 0

  for (const calc of saleCalculations) {
    totalVendido += calc.venda.valor
    totalEmpresa += calc.valorEmpresa
    totalDespachante += calc.valorDespachante
    totalPontes += calc.valorVendedor
    totalProprietario += calc.valorProprietario
  }

  return {
    totalVendido,
    quantidadeVendas: filteredVendas.length,
    totalEmpresa,
    totalDespachante,
    totalPontes,
    totalProprietario,
    vendas: saleCalculations,
  }
}
