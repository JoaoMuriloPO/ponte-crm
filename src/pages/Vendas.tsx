import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { DollarSign, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { calculateSaleValues } from "@/utils/calculations"
import { formatCurrency, formatDate } from "@/utils/format"

export default function Vendas() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const navigate = useNavigate()

  const sortedVendas = useMemo(
    () =>
      [...vendas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      ),
    [vendas]
  )

  const vendedorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const v of vendedores) {
      map[v.id] = v.nome
    }
    return map
  }, [vendedores])

  if (vendas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">
            Todas as vendas registradas.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhuma venda registrada</h2>
          <p className="mt-2 max-w-md text-center text-muted-foreground">
            Registre vendas nos perfis dos pontes para vê-las aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground">
          Todas as vendas registradas — {vendas.length} vendas no total.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vendido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                vendas.reduce((sum, v) => sum + v.valor, 0)
              )}
            </div>
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
            <div className="text-2xl font-bold">{vendas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média por Venda
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                vendas.reduce((sum, v) => sum + v.valor, 0) / vendas.length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ponte</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Ponte
                  </TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Proprietário
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Empresa
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Ferramentas
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVendas.map((venda) => {
                  const vals = calculateSaleValues(
                    venda.valor,
                    venda.distribuicao
                  )
                  return (
                    <TableRow
                      key={venda.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        navigate(`/vendedores/${venda.vendedorId}`)
                      }
                    >
                      <TableCell className="text-sm">
                        {formatDate(venda.data)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {vendedorMap[venda.vendedorId] || "Desconhecido"} - Ponte
                      </TableCell>
                      <TableCell className="text-sm">
                        {venda.descricao || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(venda.valor)}
                      </TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">
                        {formatCurrency(vals.valorVendedor)}
                      </TableCell>
                      <TableCell className="text-right text-sm hidden sm:table-cell">
                        {formatCurrency(vals.valorProprietario)}
                      </TableCell>
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {formatCurrency(vals.valorEmpresa)}
                      </TableCell>
                      <TableCell className="text-right text-sm hidden md:table-cell">
                        {vals.valorFerramentas > 0
                          ? formatCurrency(vals.valorFerramentas)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
