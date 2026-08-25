import {
  EMPRESA_PERCENTUAL,
  FERRAMENTAS_PERCENTUAL,
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
    ferramentas: vendedor.ferramentasEnabled ? FERRAMENTAS_PERCENTUAL : 0,
    vendedor: vendedor.percentualVendedor,
    proprietario: vendedor.percentualProprietario,
  }
}

export function validateDistribution(vendedor: Vendedor): boolean {
  const dist = getDistributionPercentages(vendedor)
  const total = dist.empresa + dist.ferramentas + dist.vendedor + dist.proprietario
  return total === 100
}

export function getDistributionTotal(vendedor: Vendedor): number {
  const dist = getDistributionPercentages(vendedor)
  return dist.empresa + dist.ferramentas + dist.vendedor + dist.proprietario
}

export function calculateSaleValues(valor: number, dist: Distribuicao): Omit<SaleCalculation, "venda"> {
  return {
    valorEmpresa: valor * dist.empresa / 100,
    valorFerramentas: valor * dist.ferramentas / 100,
    valorVendedor: valor * dist.vendedor / 100,
    valorProprietario: valor * dist.proprietario / 100,
  }
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
  let totalFerramentas = 0
  let totalPontes = 0
  let totalProprietario = 0

  for (const venda of vendas) {
    const calc = calculateSale(venda)
    totalVendido += venda.valor
    totalEmpresa += calc.valorEmpresa
    totalFerramentas += calc.valorFerramentas
    totalPontes += calc.valorVendedor
    totalProprietario += calc.valorProprietario
  }

  return {
    totalVendido,
    quantidadeVendas: vendas.length,
    totalEmpresa,
    totalFerramentas,
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
  let totalFerramentas = 0

  for (const venda of vendas) {
    const calc = calculateSale(venda)
    totalVendido += venda.valor
    totalVendedor += calc.valorVendedor
    totalProprietario += calc.valorProprietario
    totalEmpresa += calc.valorEmpresa
    totalFerramentas += calc.valorFerramentas
  }

  return {
    vendedor,
    quantidadeVendas: vendas.length,
    totalVendido,
    totalVendedor,
    totalProprietario,
    totalEmpresa,
    totalFerramentas,
  }
}

export function calculateReport(
  vendas: Venda[],
  dataInicio?: string,
  dataFim?: string
): ReportTotals {
  const filteredVendas = vendas.filter((venda) => {
    const vendaDate = new Date(venda.data)
    if (dataInicio && vendaDate < new Date(dataInicio)) return false
    if (dataFim) {
      const endDate = new Date(dataFim)
      endDate.setHours(23, 59, 59, 999)
      if (vendaDate > endDate) return false
    }
    return true
  })

  const saleCalculations = filteredVendas.map(calculateSale)

  let totalVendido = 0
  let totalEmpresa = 0
  let totalFerramentas = 0
  let totalPontes = 0
  let totalProprietario = 0

  for (const calc of saleCalculations) {
    totalVendido += calc.venda.valor
    totalEmpresa += calc.valorEmpresa
    totalFerramentas += calc.valorFerramentas
    totalPontes += calc.valorVendedor
    totalProprietario += calc.valorProprietario
  }

  return {
    totalVendido,
    quantidadeVendas: filteredVendas.length,
    totalEmpresa,
    totalFerramentas,
    totalPontes,
    totalProprietario,
    vendas: saleCalculations,
  }
}
