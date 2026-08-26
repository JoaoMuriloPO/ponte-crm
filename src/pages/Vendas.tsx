import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Users, DollarSign, ShoppingCart, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import { calculateSellerTotals } from "@/utils/calculations"
import { formatCurrency } from "@/utils/format"

export default function Vendas() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const navigate = useNavigate()

  const sellerSummaries = useMemo(() => {
    return vendedores.map((v) => {
      const vendasDoVendedor = vendas.filter((ve) => ve.vendedorId === v.id)
      const totals = calculateSellerTotals(v, vendasDoVendedor)
      return {
        vendedor: v,
        totals,
        quantidadeVendas: vendasDoVendedor.length,
      }
    })
  }, [vendedores, vendas])

  const globalTotal = useMemo(
    () => vendas.reduce((sum, v) => sum + v.valor, 0),
    [vendas]
  )

  if (vendas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Baixar Relatório</h1>
          <p className="text-muted-foreground">
            Resumo por ponte para download.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhuma venda registrada</h2>
          <p className="mt-2 max-w-md text-center text-muted-foreground">
            Registre vendas nos perfis dos pontes para gerar relatórios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Baixar Relatório</h1>
        <p className="text-muted-foreground">
          Resumo de cada ponte — {vendas.length} vendas no total.
        </p>
      </div>

      {/* Global summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Geral
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(globalTotal)}</div>
          <p className="text-xs text-muted-foreground">
            {vendedores.length} pontes ativos
          </p>
        </CardContent>
      </Card>

      {/* Per-seller cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sellerSummaries.map(({ vendedor, totals, quantidadeVendas }) => (
          <Card
            key={vendedor.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/vendedores/${vendedor.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{vendedor.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {quantidadeVendas} {quantidadeVendas === 1 ? "venda" : "vendas"}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                <ArrowRight className="h-3 w-3" />
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendido</p>
                  <p className="text-sm font-bold">{formatCurrency(totals.totalVendido)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Proprietário</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.totalProprietario)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ponte</p>
                  <p className="text-sm font-bold">{formatCurrency(totals.totalVendedor)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>K10: {formatCurrency(totals.totalEmpresa)}</span>
                {totals.totalDespachante > 0 && (
                  <span>· Desp: {formatCurrency(totals.totalDespachante)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
