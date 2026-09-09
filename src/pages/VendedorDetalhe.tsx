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
  Pencil,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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
  buildCustomDistribution,
  validateCustomDistribution,
} from "@/utils/calculations"
import { formatCurrency, formatDate, formatDateISO } from "@/utils/format"
import { EMPRESA_PERCENTUAL, DESPACHANTE_PERCENTUAL } from "@/types"
import type { Distribuicao, Venda } from "@/types"
import { getConfiguracoes } from "@/services/storage/localStorageService"

export default function VendedorDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById } = useVendedores()
  const {
    getByVendedor,
    add: addVenda,
    update: updateVenda,
    remove: removeVenda,
  } = useVendas()
  const config = getConfiguracoes()

  const vendedor = id ? getById(id) : undefined
  const vendas = id ? getByVendedor(id) : []

  const totals = useMemo(() => {
    if (!vendedor) return null
    return calculateSellerTotals(vendedor, vendas)
  }, [vendedor, vendas])

  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null)
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null)

  // Sale form
  const [saleValor, setSaleValor] = useState("")
  const [saleData, setSaleData] = useState(formatDateISO(new Date()))
  const [saleDescricao, setSaleDescricao] = useState("")

  // Custom distribution
  const [customDistribution, setCustomDistribution] = useState(false)
  const [customPonteValue, setCustomPonteValue] = useState("")
  const [customProprietarioValue, setCustomProprietarioValue] = useState("")
  const [customPontePct, setCustomPontePct] = useState("")
  const [customProprietarioPct, setCustomProprietarioPct] = useState("")
  const [customPonteClamped, setCustomPonteClamped] = useState(false)
  const [customProprietarioClamped, setCustomProprietarioClamped] = useState(false)
  const [attemptedCustomSave, setAttemptedCustomSave] = useState(false)

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
    setEditingSaleId(null)
    setSaleValor("")
    setSaleData(formatDateISO(new Date()))
    setSaleDescricao("")
    setCustomDistribution(false)
    setCustomPonteValue("")
    setCustomProprietarioValue("")
    setCustomPontePct("")
    setCustomProprietarioPct("")
    setCustomPonteClamped(false)
    setCustomProprietarioClamped(false)
    setAttemptedCustomSave(false)
    setSaleDialogOpen(true)
  }

  function setCustomDefaults(valor: number) {
    const vals = calculateSaleValues(valor, dist)
    setCustomPonteValue(String(Math.round(vals.valorVendedor)))
    setCustomProprietarioValue(String(Math.round(vals.valorProprietario)))
    setCustomPontePct(pctStr((vals.valorVendedor / valor) * 100))
    setCustomProprietarioPct(pctStr((vals.valorProprietario / valor) * 100))
  }

  function openEditSaleDialog(venda: Venda) {
    setEditingSaleId(venda.id)
    setSaleValor(String(venda.valor))
    setSaleData(formatDateISO(new Date(venda.data)))
    setSaleDescricao(venda.descricao || "")
    const custom = !!venda.distribuicaoCustomizada
    setCustomDistribution(custom)
    setAttemptedCustomSave(false)
    setCustomPontePct("")
    setCustomProprietarioPct("")
    setCustomPonteClamped(false)
    setCustomProprietarioClamped(false)
    if (custom) {
      const vals = calculateSaleValues(venda.valor, venda.distribuicao)
      setCustomPonteValue(String(Math.round(vals.valorVendedor)))
      setCustomProprietarioValue(String(Math.round(vals.valorProprietario)))
      setCustomPontePct(venda.distribuicao.vendedor.toFixed(2).replace(/\.?0+$/, ""))
      setCustomProprietarioPct(venda.distribuicao.proprietario.toFixed(2).replace(/\.?0+$/, ""))
    } else {
      setCustomDefaults(venda.valor)
    }
    setSaleDialogOpen(true)
  }

  function handleToggleCustom(checked: boolean) {
    setCustomDistribution(checked)
    setCustomPonteClamped(false)
    setCustomProprietarioClamped(false)
    if (checked) {
      const parsed = parseCurrencyInput(saleValor)
      if (!isNaN(parsed) && parsed > 0) setCustomDefaults(parsed)
    }
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

  function parsePctInput(value: string): number {
    if (!value.trim()) return NaN
    let cleaned = value.replace(/[R$\s]/g, "")
    // Brazilian comma decimal: 15,5 -> 15.5
    if (cleaned.includes(",")) cleaned = cleaned.replace(/\./g, "").replace(",", ".")
    return parseFloat(cleaned)
  }

  function round2(n: number): number {
    return Math.round(n * 100) / 100
  }

  function moneyStr(n: number): string {
    return String(round2(n))
  }

  function pctStr(n: number): string {
    return String(round2(n))
  }

  const parsedValor = parseCurrencyInput(saleValor)
  const parsedPonte = parseCurrencyInput(customPonteValue)
  const parsedProprietario = parseCurrencyInput(customProprietarioValue)

  const customAvailablePct = 100 - dist.empresa - dist.despachante
  const customAvailableValue =
    !isNaN(parsedValor) && parsedValor > 0
      ? (parsedValor * customAvailablePct) / 100
      : 0

  function handlePonteValueChange(raw: string) {
    setAttemptedCustomSave(false)
    const cleaned = raw.replace(/[^0-9.,]/g, "")
    setCustomPonteValue(cleaned)
    setCustomPonteClamped(false)
    if (isNaN(parsedValor) || parsedValor <= 0) return
    const parsed = parseCurrencyInput(cleaned)
    if (isNaN(parsed)) return
    if (parsed > customAvailableValue) setCustomPonteClamped(true)
    const ponte = Math.min(parsed, customAvailableValue)
    setCustomPonteValue(moneyStr(ponte))
    setCustomPontePct(pctStr((ponte / parsedValor) * 100))
  }

  function handleProprietarioValueChange(raw: string) {
    setAttemptedCustomSave(false)
    const cleaned = raw.replace(/[^0-9.,]/g, "")
    setCustomProprietarioValue(cleaned)
    setCustomProprietarioClamped(false)
    if (isNaN(parsedValor) || parsedValor <= 0) return
    const parsed = parseCurrencyInput(cleaned)
    if (isNaN(parsed)) return
    if (parsed > customAvailableValue) setCustomProprietarioClamped(true)
    const prop = Math.min(parsed, customAvailableValue)
    setCustomProprietarioValue(moneyStr(prop))
    setCustomProprietarioPct(pctStr((prop / parsedValor) * 100))
  }

  function handlePontePctChange(raw: string) {
    setAttemptedCustomSave(false)
    const cleaned = raw.replace(/[^0-9.,]/g, "")
    setCustomPontePct(cleaned)
    setCustomPonteClamped(false)
    if (isNaN(parsedValor) || parsedValor <= 0) return
    const pct = parsePctInput(cleaned)
    if (isNaN(pct)) return
    if (pct > customAvailablePct) setCustomPonteClamped(true)
    const clamped = Math.min(pct, customAvailablePct)
    const ponte = round2((parsedValor * clamped) / 100)
    setCustomPonteValue(moneyStr(ponte))
    setCustomPontePct(pctStr(clamped))
  }

  function handleProprietarioPctChange(raw: string) {
    setAttemptedCustomSave(false)
    const cleaned = raw.replace(/[^0-9.,]/g, "")
    setCustomProprietarioPct(cleaned)
    setCustomProprietarioClamped(false)
    if (isNaN(parsedValor) || parsedValor <= 0) return
    const pct = parsePctInput(cleaned)
    if (isNaN(pct)) return
    if (pct > customAvailablePct) setCustomProprietarioClamped(true)
    const clamped = Math.min(pct, customAvailablePct)
    const prop = round2((parsedValor * clamped) / 100)
    setCustomProprietarioValue(moneyStr(prop))
    setCustomProprietarioPct(pctStr(clamped))
  }

  const ponteSugerido =
    !isNaN(parsedValor) &&
    parsedValor > 0 &&
    !isNaN(parsedProprietario) &&
    customAvailableValue - parsedProprietario >= 0
      ? moneyStr(round2(customAvailableValue - parsedProprietario))
      : ""
  const proprietarioSugerido =
    !isNaN(parsedValor) &&
    parsedValor > 0 &&
    !isNaN(parsedPonte) &&
    customAvailableValue - parsedPonte >= 0
      ? moneyStr(round2(customAvailableValue - parsedPonte))
      : ""
  const pontePctSugerido =
    !isNaN(parsedValor) &&
    parsedValor > 0 &&
    !isNaN(parsedProprietario) &&
    customAvailableValue - parsedProprietario >= 0
      ? pctStr(((customAvailableValue - parsedProprietario) / parsedValor) * 100)
      : ""
  const proprietarioPctSugerido =
    !isNaN(parsedValor) &&
    parsedValor > 0 &&
    !isNaN(parsedPonte) &&
    customAvailableValue - parsedPonte >= 0
      ? pctStr(((customAvailableValue - parsedPonte) / parsedValor) * 100)
      : ""

  const previewDist: Distribuicao = customDistribution
    ? buildCustomDistribution(
        dist,
        isNaN(parsedValor) || parsedValor <= 0 ? 0 : parsedValor,
        isNaN(parsedPonte) ? 0 : parsedPonte,
        isNaN(parsedProprietario) ? 0 : parsedProprietario
      )
    : dist

  const pontePct = previewDist.vendedor
  const proprietarioPct = previewDist.proprietario

  const customTotal =
    previewDist.empresa +
    previewDist.despachante +
    previewDist.vendedor +
    previewDist.proprietario
  const customValid =
    customDistribution &&
    !isNaN(parsedValor) &&
    parsedValor > 0 &&
    !isNaN(parsedPonte) &&
    !isNaN(parsedProprietario)
      ? validateCustomDistribution(dist, parsedValor, parsedPonte, parsedProprietario)
      : false
  const customValuesFilled =
    !isNaN(parsedPonte) && !isNaN(parsedProprietario)

  function getPreviewSaleValues(): Omit<
    import("@/types").SaleCalculation,
    "venda"
  > | null {
    const parsed = parseCurrencyInput(saleValor)
    if (isNaN(parsed) || parsed <= 0) return null
    if (customDistribution && !customValuesFilled) return null
    return calculateSaleValues(parsed, previewDist)
  }

  function handleSaveSale() {
    const parsed = parseCurrencyInput(saleValor)
    if (isNaN(parsed) || parsed <= 0) return

    let distribuicao = { ...dist }
    if (customDistribution) {
      if (!customValid) {
        setAttemptedCustomSave(true)
        return
      }
      distribuicao = buildCustomDistribution(
        dist,
        parsed,
        parsedPonte,
        parsedProprietario
      )
    }

    if (editingSaleId) {
      const existing = vendas.find((v) => v.id === editingSaleId)
      if (!existing) return
      updateVenda({
        ...existing,
        valor: parsed,
        data: new Date(saleData).toISOString(),
        descricao: saleDescricao.trim() || undefined,
        distribuicao,
        distribuicaoCustomizada: customDistribution || undefined,
      })
    } else {
      addVenda({
        id: crypto.randomUUID(),
        vendedorId: vendedor!.id,
        valor: parsed,
        data: new Date(saleData).toISOString(),
        descricao: saleDescricao.trim() || undefined,
        distribuicao,
        distribuicaoCustomizada: customDistribution || undefined,
      })
    }

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{vendedor.nome} - Ponte</h1>
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
                <span className="text-sm text-muted-foreground">K10</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatCurrency(totals?.totalEmpresa ?? 0)}</span>
                  <Badge variant="outline">{EMPRESA_PERCENTUAL}% — fixo</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Despachante</span>
                {vendedor.despachanteEnabled ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(totals?.totalDespachante ?? 0)}</span>
                    <Badge variant="default">{DESPACHANTE_PERCENTUAL}% — ativo</Badge>
                  </div>
                ) : (
                  <Badge variant="secondary">✕ Não habilitado</Badge>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{vendedor.nome} — Ponte</span>
                <span className="font-semibold">{vendedor.percentualVendedor}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{config.nomeProprietario} — Proprietário</span>
                <span className="font-semibold">{vendedor.percentualProprietario}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <Badge
                  variant={
                    dist.empresa + dist.despachante + dist.vendedor + dist.proprietario === 100
                      ? "default"
                      : "destructive"
                  }
                >
                  {dist.empresa + dist.despachante + dist.vendedor + dist.proprietario}%
                  {dist.empresa + dist.despachante + dist.vendedor + dist.proprietario === 100
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
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-xs">K10 Total</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(totals.totalEmpresa + totals.totalDespachante)}</p>
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
              <p className="mt-3 text-sm font-medium text-foreground">Nenhuma venda registrada</p>
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
                      K10
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
                    <TableHead className="w-16"></TableHead>
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
                          {formatCurrency(vals.valorEmpresa)}
                        </TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">
                          {vals.valorDespachante > 0
                            ? formatCurrency(vals.valorDespachante)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">
                          {formatCurrency(vals.valorVendedor)}
                        </TableCell>
                        <TableCell className="text-right text-sm hidden sm:table-cell">
                          {formatCurrency(vals.valorProprietario)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Editar venda"
                              onClick={() => openEditSaleDialog(venda)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Excluir venda"
                              onClick={() => setDeleteSaleId(venda.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
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
            <DialogTitle>
              {editingSaleId ? "Editar venda" : "Registrar venda"}
            </DialogTitle>
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

            {/* Custom distribution */}
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom-distribuicao">
                    Distribuição personalizada
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ajuste quanto de cada parte fica nesta venda.
                  </p>
                </div>
                <Switch
                  id="custom-distribuicao"
                  checked={customDistribution}
                  onCheckedChange={handleToggleCustom}
                />
              </div>

              {customDistribution && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="custom-ponte" className="text-xs">
                        {vendedor.nome} — Ponte
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          id="custom-ponte"
                          type="text"
                          inputMode="decimal"
                          className="pl-9"
                          value={customPonteValue}
                          onChange={(e) => handlePonteValueChange(e.target.value)}
                          placeholder={ponteSugerido || "0,00"}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                        <Input
                          id="custom-ponte-pct"
                          type="text"
                          inputMode="decimal"
                          aria-label="Porcentagem da ponte"
                          className={
                            customPonteClamped
                              ? "border-destructive pl-9"
                              : "pl-9"
                          }
                          value={customPontePct}
                          onChange={(e) => handlePontePctChange(e.target.value)}
                          placeholder={pontePctSugerido || "0"}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pontePct.toFixed(2)}% da venda
                      </p>
                      {customPonteClamped && (
                        <p className="text-xs text-destructive">
                          Máx. disponível: {customAvailablePct}%
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="custom-proprietario" className="text-xs">
                        {config.nomeProprietario}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          R$
                        </span>
                        <Input
                          id="custom-proprietario"
                          type="text"
                          inputMode="decimal"
                          className="pl-9"
                          value={customProprietarioValue}
                          onChange={(e) =>
                            handleProprietarioValueChange(e.target.value)
                          }
                          placeholder={proprietarioSugerido || "0,00"}
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                        <Input
                          id="custom-proprietario-pct"
                          type="text"
                          inputMode="decimal"
                          aria-label="Porcentagem do proprietário"
                          className={
                            customProprietarioClamped
                              ? "border-destructive pl-9"
                              : "pl-9"
                          }
                          value={customProprietarioPct}
                          onChange={(e) =>
                            handleProprietarioPctChange(e.target.value)
                          }
                          placeholder={proprietarioPctSugerido || "0"}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {proprietarioPct.toFixed(2)}% da venda
                      </p>
                      {customProprietarioClamped && (
                        <p className="text-xs text-destructive">
                          Máx. disponível: {customAvailablePct}%
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o valor ou a % de cada um — o outro lado mostra no
                    placeholder quanto falta para fechar os {customAvailablePct}%
                    disponíveis (K10 + Despachante são fixos).
                  </p>
                </div>
              )}
            </div>

            {/* Sale preview */}
            {preview && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Distribuição da venda:
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    K10 ({previewDist.empresa}%)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(preview.valorEmpresa)}
                  </span>
                </div>
                {previewDist.despachante > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Despachante ({previewDist.despachante}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(preview.valorDespachante)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Ponte (
                    {customDistribution
                      ? previewDist.vendedor.toFixed(2)
                      : previewDist.vendedor}
                    %)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(preview.valorVendedor)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {config.nomeProprietario} (
                    {customDistribution
                      ? previewDist.proprietario.toFixed(2)
                      : previewDist.proprietario}
                    %)
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(preview.valorProprietario)}
                  </span>
                </div>
                {/* Total check */}
                <div className="border-t pt-1.5 mt-1.5">
                  <div
                    className={`flex justify-between text-sm font-semibold ${
                      attemptedCustomSave && !customValid
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span>Total</span>
                    <span>
                      {customTotal.toFixed(2)}%
                      {attemptedCustomSave && !customValid ? " ⚠" : ""}
                    </span>
                  </div>
                  {attemptedCustomSave && !customValid && (
                    <p className="text-xs text-destructive mt-1">
                      Os percentuais precisam totalizar 100%.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSale}
              disabled={
                !saleValor ||
                !saleData ||
                (customDistribution && !customValuesFilled)
              }
            >
              {editingSaleId ? "Salvar alterações" : "Registrar venda"}
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
