import { useState, useMemo } from "react"
import {
  BarChart3,
  Building2,
  DollarSign,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function Relatorios() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const config = getConfiguracoes()

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [selectedVendedor, setSelectedVendedor] = useState<string>("all")

  const report = useMemo(() => {
    return calculateReport(vendas, dataInicio || undefined, dataFim || undefined)
  }, [vendas, dataInicio, dataFim])

  const filteredVendas = useMemo(() => {
    if (selectedVendedor === "all") return report.vendas
    return report.vendas.filter(
      (sc) => sc.venda.vendedorId === selectedVendedor
    )
  }, [report.vendas, selectedVendedor])

  const chartData = useMemo(() => {
    const data = [
      { name: "Empresa", value: report.totalEmpresa },
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

  function clearFilters() {
    setDataInicio("")
    setDataFim("")
    setSelectedVendedor("all")
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
          <div className="grid gap-4 sm:grid-cols-4">
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
            <div className="space-y-2">
              <Label>Ponte</Label>
              <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome} - Ponte
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {config.nomeProprietario} (Proprietário)
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.totalProprietario)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Comissão do proprietário
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
                <p className="text-xs text-muted-foreground">
                  Custos com despachante
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pie chart - distribution */}
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

            {/* Bar chart - by seller */}
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
                    <Bar
                      dataKey="vendido"
                      name="Total Vendido"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="proprietario"
                      name="Proprietário"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ponte"
                      name="Ponte"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatório Detalhado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Empresa — 60%</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(report.totalEmpresa)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Wrench className="h-4 w-4" />
                      <span className="text-sm font-medium">Despachante</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(report.totalDespachante)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Pontes</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(report.totalPontes)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                      <UserCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">{config.nomeProprietario} (Proprietário)</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(report.totalProprietario)}
                    </p>
                  </div>
                </div>

                {/* Individual sales */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Vendas individuais ({filteredVendas.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">
                            Empresa
                          </TableHead>
                          <TableHead className="text-right hidden sm:table-cell">
                            Despachante
                          </TableHead>
                          <TableHead className="text-right hidden sm:table-cell">
                            Ponte
                          </TableHead>
                          <TableHead className="text-right hidden sm:table-cell">
                            Proprietário
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVendas.map((sc) => (
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
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
