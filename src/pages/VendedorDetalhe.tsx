import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  DollarSign,
  ShoppingCart,
  UserCheck,
  Building2,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import {
  getDistributionPercentages,
  calculateSellerTotals,
  calculateSaleValues,
} from "@/utils/calculations"
import { formatCurrency, formatDate, formatDateISO } from "@/utils/format"
import { EMPRESA_PERCENTUAL, FERRAMENTAS_PERCENTUAL } from "@/types"
import type { Venda } from "@/types"
import { getConfiguracoes } from "@/services/storage/localStorageService"

export default function VendedorDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById } = useVendedores()
  const { getByVendedor, add: addVenda, remove: removeVenda } = useVendas()
  const config = getConfiguracoes()

  const vendedor = id ? getById(id) : undefined
  const vendas = id ? getByVendedor(id) : []

  const totals = useMemo(() => {
    if (!vendedor) return null
    return calculateSellerTotals(vendedor, vendas)
  }, [vendedor, vendas])

  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null)

  // Sale form
  const [saleValor, setSaleValor] = useState("")
  const [saleData, setSaleData] = useState(formatDateISO(new Date()))
  const [saleDescricao, setSaleDescricao] = useState("")

  if (!vendedor) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Ponte não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/vendedores")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  const dist = getDistributionPercentages(vendedor)
  const sortedVendas = [...vendas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )

  function openSaleDialog() {
    setSaleValor("")
    setSaleData(formatDateISO(new Date()))
    setSaleDescricao("")
    setSaleDialogOpen(true)
  }

  function parseCurrencyInput(value: string): number {
    // Handle empty
    if (!value.trim()) return NaN
    // Remove R$, spaces
    let cleaned = value.replace(/[R$\s]/g, "")
    // If has comma, it's Brazilian format: 20.000,00
    if (cleaned.includes(",")) {
      // Remove thousand dots, replace decimal comma with period
      cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    } else {
      // US format or plain number: remove dots (thousand separators)
      cleaned = cleaned.replace(/\./g, "")
    }
    return parseFloat(cleaned)
  }

  function getPreviewSaleValues(): Omit<
    import("@/types").SaleCalculation,
    "venda"
  > | null {
    const parsed = parseCurrencyInput(saleValor)
    if (isNaN(parsed) || parsed <= 0) return null
    return calculateSaleValues(parsed, dist)
  }

  function handleSaveSale() {
    const parsed = parseCurrencyInput(saleValor)
    if (isNaN(parsed) || parsed <= 0) return

    const novaVenda: Venda = {
      id: crypto.randomUUID(),
      vendedorId: vendedor!.id,
      valor: parsed,
      data: new Date(saleData).toISOString(),
      descricao: saleDescricao.trim() || undefined,
      distribuicao: { ...dist },
    }

    addVenda(novaVenda)
    setSaleDialogOpen(false)
  }

  function handleDeleteSale(vendaId: string) {
    removeVenda(vendaId)
    setDeleteSaleId(null)
  }

  const preview = getPreviewSaleValues()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendedores")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{vendedor.nome} - Ponte</h1>
          <p className="text-muted-foreground">
            Ponte desde {formatDate(vendedor.createdAt)}
          </p>
        </div>
        <Button onClick={openSaleDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova venda
        </Button>
      </div>

      {/* Financial config card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <Badge variant="outline">{EMPRESA_PERCENTUAL}% — fixo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ferramentas</span>
                <Badge variant={vendedor.ferramentasEnabled ? "default" : "secondary"}>
                  {vendedor.ferramentasEnabled
                    ? `${FERRAMENTAS_PERCENTUAL}% — ativo`
                    : "Desativado"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ponte</span>
                <span className="font-semibold">{vendedor.percentualVendedor}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{config.nomeProprietario} (Proprietário)</span>
                <span className="font-semibold">{vendedor.percentualProprietario}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <Badge
                  variant={
                    dist.empresa + dist.ferramentas + dist.vendedor + dist.proprietario === 100
                      ? "default"
                      : "destructive"
                  }
                >
                  {dist.empresa + dist.ferramentas + dist.vendedor + dist.proprietario}%
                  {dist.empresa + dist.ferramentas + dist.vendedor + dist.proprietario === 100
                    ? " ✓"
                    : " ⚠"}
                </Badge>
              </div>
            </div>

            {/* Summary cards */}
            {totals && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="text-xs">Total Vendido</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(totals.totalVendido)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span className="text-xs">Vendas</span>
                  </div>
                  <p className="text-lg font-bold">{totals.quantidadeVendas}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="text-xs">Proprietário</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.totalProprietario)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Ponte</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(totals.totalVendedor)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedVendas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">Nenhuma venda registrada</p>
              <p className="text-xs text-muted-foreground">
                Registre a primeira venda deste ponte.
              </p>
              <Button className="mt-4" size="sm" onClick={openSaleDialog}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Registrar venda
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
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
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVendas.map((venda) => {
                    const vals = calculateSaleValues(venda.valor, venda.distribuicao)
                    return (
                      <TableRow key={venda.id}>
                        <TableCell className="text-sm">
                          {formatDate(venda.data)}
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDeleteSaleId(venda.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor da venda</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor"
                  type="text"
                  className="pl-10"
                  value={saleValor}
                  onChange={(e) => setSaleValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={saleData}
                onChange={(e) => setSaleData(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                value={saleDescricao}
                onChange={(e) => setSaleDescricao(e.target.value)}
                placeholder="Ex: Mentoria Premium"
              />
            </div>

            {/* Sale preview */}
            {preview && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Distribuição da venda:
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Empresa ({dist.empresa}%)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(preview.valorEmpresa)}
                  </span>
                </div>
                {dist.ferramentas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ferramentas ({dist.ferramentas}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(preview.valorFerramentas)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Ponte ({dist.vendedor}%)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(preview.valorVendedor)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Proprietário ({dist.proprietario}%)
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(preview.valorProprietario)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSale} disabled={!saleValor || !saleData}>
              Registrar venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sale Confirmation */}
      <Dialog
        open={deleteSaleId !== null}
        onOpenChange={() => setDeleteSaleId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir venda</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta venda? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSaleId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSaleId && handleDeleteSale(deleteSaleId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
