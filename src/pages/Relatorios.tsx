import { useState, useMemo } from "react"
import {
  BarChart3,
  DollarSign,
  UserCheck,
  Users,
  Wrench,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import { calculateReport, calculateSellerTotals } from "@/utils/calculations"
import { formatCurrency } from "@/utils/format"
import { getConfiguracoes } from "@/services/storage/localStorageService"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

export default function Relatorios() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const config = getConfiguracoes()

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [expandedSellers, setExpandedSellers] = useState<Set<string>>(new Set())

  const report = useMemo(() => {
    return calculateReport(vendas, dataInicio || undefined, dataFim || undefined)
  }, [vendas, dataInicio, dataFim])

  const chartData = useMemo(() => {
    const data = [
      { name: "K10", value: report.totalEmpresa },
      { name: "Despachante", value: report.totalDespachante },
      { name: "Pontes", value: report.totalPontes },
      { name: config.nomeProprietario, value: report.totalProprietario },
    ].filter((d) => d.value > 0)
    return data
  }, [report, config.nomeProprietario])

  const sellerBarData = useMemo(() => {
    return vendedores.map((v) => {
      const vendasDoVendedor = vendas.filter((ve) => ve.vendedorId === v.id)
      const st = calculateSellerTotals(v, vendasDoVendedor)
      return {
        name: v.nome.split(" ")[0],
        vendido: st.totalVendido,
        proprietario: st.totalProprietario,
        ponte: st.totalVendedor,
      }
    })
  }, [vendedores, vendas])

  const sellerDetails = useMemo(() => {
    return vendedores.map((v) => {
      const vendasDoVendedor = report.vendas.filter(
        (sc) => sc.venda.vendedorId === v.id
      )
      return {
        vendedor: v,
        vendas: vendasDoVendedor,
        totals: calculateSellerTotals(v, vendasDoVendedor.map((sc) => sc.venda)),
      }
    }).filter((s) => s.vendas.length > 0)
  }, [vendedores, report.vendas])

  function toggleSeller(id: string) {
    setExpandedSellers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearFilters() {
    setDataInicio("")
    setDataFim("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Análise detalhada das vendas e distribuição financeira.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.quantidadeVendas === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhum dado encontrado</h2>
          <p className="mt-2 max-w-md text-center text-muted-foreground">
            Ajuste os filtros ou registre vendas para ver os relatórios.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
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
                  {formatCurrency(report.totalVendido)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.quantidadeVendas} vendas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  K10
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totalEmpresa)}
                </div>
                <p className="text-xs text-muted-foreground">60% fixo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despachante
                </CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.totalDespachante)}
                </div>
                <p className="text-xs text-muted-foreground">Custos com despachante</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {config.nomeProprietario}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.totalProprietario)}
                </div>
                <p className="text-xs text-muted-foreground">Comissão do proprietário</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Ponte</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sellerBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      formatter={(value: unknown) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="vendido" name="Vendido" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="proprietario" name="Proprietário" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ponte" name="Ponte" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Per-seller expandable sections */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Vendas por Ponte</h3>
            {sellerDetails.map(({ vendedor, vendas: vendasSeller, totals }) => {
              const isExpanded = expandedSellers.has(vendedor.id)
              return (
                <Card key={vendedor.id}>
                  <button
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
                    onClick={() => toggleSeller(vendedor.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{vendedor.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendasSeller.length} vendas · {formatCurrency(totals.totalVendido)}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right hidden sm:table-cell">K10</TableHead>
                              <TableHead className="text-right hidden sm:table-cell">Despachante</TableHead>
                              <TableHead className="text-right hidden sm:table-cell">Ponte</TableHead>
                              <TableHead className="text-right hidden sm:table-cell">Proprietário</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vendasSeller.map((sc) => (
                              <TableRow key={sc.venda.id}>
                                <TableCell className="text-sm">
                                  {new Date(sc.venda.data).toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {sc.venda.descricao || "—"}
                                </TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                  {formatCurrency(sc.venda.valor)}
                                </TableCell>
                                <TableCell className="text-right text-sm hidden sm:table-cell">
                                  {formatCurrency(sc.valorEmpresa)}
                                </TableCell>
                                <TableCell className="text-right text-sm hidden sm:table-cell">
                                  {sc.valorDespachante > 0
                                    ? formatCurrency(sc.valorDespachante)
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm hidden sm:table-cell">
                                  {formatCurrency(sc.valorVendedor)}
                                </TableCell>
                                <TableCell className="text-right text-sm hidden sm:table-cell">
                                  {formatCurrency(sc.valorProprietario)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
