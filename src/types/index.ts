export const EMPRESA_PERCENTUAL = 60
export const FERRAMENTAS_PERCENTUAL = 10

export interface Vendedor {
  id: string
  nome: string
  createdAt: string
  ferramentasEnabled: boolean
  percentualVendedor: number
  percentualProprietario: number
}

export interface Distribuicao {
  empresa: number
  ferramentas: number
  vendedor: number
  proprietario: number
}

export interface Venda {
  id: string
  vendedorId: string
  valor: number
  data: string
  descricao?: string
  distribuicao: Distribuicao
}

export interface SaleCalculation {
  venda: Venda
  valorEmpresa: number
  valorFerramentas: number
  valorVendedor: number
  valorProprietario: number
}

export interface DashboardTotals {
  totalVendido: number
  quantidadeVendas: number
  totalEmpresa: number
  totalFerramentas: number
  totalPontes: number
  totalProprietario: number
  quantidadePontes: number
}

export interface SellerTotals {
  vendedor: Vendedor
  quantidadeVendas: number
  totalVendido: number
  totalVendedor: number
  totalProprietario: number
  totalEmpresa: number
  totalFerramentas: number
}

export interface ReportTotals {
  totalVendido: number
  quantidadeVendas: number
  totalEmpresa: number
  totalFerramentas: number
  totalPontes: number
  totalProprietario: number
  vendas: SaleCalculation[]
}

export interface Configuracoes {
  nomeProprietario: string
}
