import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Users, DollarSign, ShoppingCart, FileDown, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import { calculateSellerTotals, calculateSale } from "@/utils/calculations"
import { formatCurrency } from "@/utils/format"
import { getConfiguracoes } from "@/services/storage/localStorageService"
import type { Vendedor, Venda } from "@/types"

function generatePdfHtml(
  vendedor: Vendedor,
  vendas: Venda[],
  config: { nomeProprietario: string }
): string {
  const calcVendas = vendas.map((v) => calculateSale(v))
  const totals = calculateSellerTotals(vendedor, vendas)

  const rows = calcVendas
    .sort((a, b) => new Date(b.venda.data).getTime() - new Date(a.venda.data).getTime())
    .map(
      (sc) => `
      <tr>
        <td>${new Date(sc.venda.data).toLocaleDateString("pt-BR")}</td>
        <td>${sc.venda.descricao || "—"}</td>
        <td class="right">${formatCurrency(sc.venda.valor)}</td>
        <td class="right">${formatCurrency(sc.valorEmpresa)}</td>
        <td class="right">${sc.valorDespachante > 0 ? formatCurrency(sc.valorDespachante) : "—"}</td>
        <td class="right">${formatCurrency(sc.valorVendedor)}</td>
        <td class="right">${formatCurrency(sc.valorProprietario)}</td>
      </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório - ${vendedor.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .summary-card .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    .dist { margin-bottom: 24px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; }
    .dist h3 { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .dist-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding: 8px 12px; }
    td { font-size: 13px; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    td.right { text-align: right; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Relatório — ${vendedor.nome}</h1>
      <p>Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Vendido</div>
      <div class="value">${formatCurrency(totals.totalVendido)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Proprietário (${config.nomeProprietario})</div>
      <div class="value" style="color:#059669">${formatCurrency(totals.totalProprietario)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Ponte</div>
      <div class="value">${formatCurrency(totals.totalVendedor)}</div>
    </div>
    <div class="summary-card">
      <div class="label">K10</div>
      <div class="value">${formatCurrency(totals.totalEmpresa)}</div>
    </div>
  </div>

  <div class="dist">
    <h3>Distribuição</h3>
    <div class="dist-row"><span>K10 (60%)</span><span>${formatCurrency(totals.totalEmpresa)}</span></div>
    ${vendedor.despachanteEnabled ? `<div class="dist-row"><span>Despachante (10%)</span><span>${formatCurrency(totals.totalDespachante)}</span></div>` : ""}
    <div class="dist-row"><span>Ponte (${vendedor.percentualVendedor}%)</span><span>${formatCurrency(totals.totalVendedor)}</span></div>
    <div class="dist-row"><span>${config.nomeProprietario} — Proprietário (${vendedor.percentualProprietario}%)</span><span>${formatCurrency(totals.totalProprietario)}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Descrição</th>
        <th class="right">Valor</th>
        <th class="right">K10</th>
        <th class="right">Despachante</th>
        <th class="right">Ponte</th>
        <th class="right">Proprietário</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    CRM Financeiro — Relatório gerado automaticamente
  </div>
</body>
</html>`
}

function downloadReport(vendedor: Vendedor, vendas: Venda[], config: { nomeProprietario: string }) {
  const html = generatePdfHtml(vendedor, vendas, config)
  const w = window.open("", "_blank")
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }
}

export default function Vendas() {
  const { vendedores } = useVendedores()
  const { vendas } = useVendas()
  const navigate = useNavigate()
  const config = getConfiguracoes()

  const sellerSummaries = useMemo(() => {
    return vendedores.map((v) => {
      const vendasDoVendedor = vendas.filter((ve) => ve.vendedorId === v.id)
      const totals = calculateSellerTotals(v, vendasDoVendedor)
      return {
        vendedor: v,
        vendas: vendasDoVendedor,
        totals,
        quantidadeVendas: vendasDoVendedor.length,
      }
    })
  }, [vendedores, vendas])

  const globalTotal = useMemo(
    () => vendas.reduce((sum, v) => sum + v.valor, 0),
    [vendas]
  )

  const totalProprietario = useMemo(
    () =>
      sellerSummaries.reduce((sum, s) => sum + s.totals.totalProprietario, 0),
    [sellerSummaries]
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
      <div className="grid gap-4 sm:grid-cols-2">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total do Proprietário
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalProprietario)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total a receber
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-seller cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sellerSummaries.map(({ vendedor, vendas: vendasSeller, totals, quantidadeVendas }) => (
          <Card key={vendedor.id} className="transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div
                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                onClick={() => navigate(`/vendedores/${vendedor.id}`)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">{vendedor.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {quantidadeVendas} {quantidadeVendas === 1 ? "venda" : "vendas"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 shrink-0 ml-2"
                onClick={() => downloadReport(vendedor, vendasSeller, config)}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="text-xs">PDF</span>
              </Button>
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
