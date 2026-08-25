import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  DollarSign,
  Users,
  Building2,
  Wrench,
  TrendingUp,
  UserCheck,
  ShoppingCart,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import {
  calculateDashboardTotals,
  calculateSellerTotals,
} from "@/utils/calculations"
import { formatCurrency, formatPercent } from "@/utils/format"
import { getConfiguracoes } from "@/services/storage/localStorageService"

export default function Dashboard() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const navigate = useNavigate()
  const config = getConfiguracoes()

  const totals = useMemo(
    () => calculateDashboardTotals(vendas, vendedores),
    [vendas, vendedores]
  )

  const sellerTotals = useMemo(() => {
    return vendedores.map((v) => {
      const vendasDoVendedor = vendas.filter((ve) => ve.vendedorId === v.id)
      return calculateSellerTotals(v, vendasDoVendedor)
    })
  }, [vendedores, vendas])

  if (vendedores.length === 0 && vendas.length === 0) {
    return <EmptyState onNavigate={navigate} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas vendas e comissões.
        </p>
      </div>

      {/* Main cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vendido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalVendido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.quantidadeVendas} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Minha Comissão
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totals.totalProprietario)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total destinado a {config.nomeProprietario}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empresa
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalEmpresa)}
            </div>
            <p className="text-xs text-muted-foreground">60% fixo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ferramentas
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalFerramentas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.quantidadePontes} pontes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary cards row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pontes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalPontes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Distribuído entre pontes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade de Vendas
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.quantidadeVendas}</div>
            <p className="text-xs text-muted-foreground">
              {totals.quantidadePontes} pontes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sellers table */}
      {sellerTotals.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Desempenho por Ponte</CardTitle>
              <p className="text-sm text-muted-foreground">
                Resumo de vendas de cada ponte.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vendedores")}
            >
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ponte</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      % Ponte
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      % Proprietário
                    </TableHead>
                    <TableHead className="text-right">Total Ponte</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Total Proprietário
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerTotals.map((st) => (
                    <TableRow
                      key={st.vendedor.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/vendedores/${st.vendedor.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {st.vendedor.nome} - Ponte
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {st.quantidadeVendas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(st.totalVendido)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {formatPercent(st.vendedor.percentualVendedor)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {formatPercent(st.vendedor.percentualProprietario)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(st.totalVendedor)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {formatCurrency(st.totalProprietario)}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyState({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Bem-vindo ao CRM Financeiro</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Cadastre seu primeiro ponte para começar a acompanhar suas vendas e
        comissões.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => onNavigate("/vendedores")}>
          <Users className="mr-2 h-4 w-4" />
          Adicionar ponte
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            import("@/lib/demo-data").then((m) => {
              m.loadDemoData()
              onNavigate("/")
              window.location.reload()
            })
          }}
        >
          Carregar dados de demonstração
        </Button>
      </div>
    </div>
  )
}
