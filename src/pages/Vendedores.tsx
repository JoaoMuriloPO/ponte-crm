import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Users, Trash2, Edit, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"
import { validateDistribution } from "@/utils/calculations"
import { formatCurrency } from "@/utils/format"
import { calculateSellerTotals } from "@/utils/calculations"
import type { Vendedor } from "@/types"
import { EMPRESA_PERCENTUAL, FERRAMENTAS_PERCENTUAL } from "@/types"

export default function Vendedores() {
  const { vendedores, add, update, remove } = useVendedores()
  const { vendas } = useVendas()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [nome, setNome] = useState("")
  const [ferramentasEnabled, setFerramentasEnabled] = useState(true)
  const [percentualVendedor, setPercentualVendedor] = useState(20)
  const [percentualProprietario, setPercentualProprietario] = useState(10)

  function openNewDialog() {
    setEditingId(null)
    setNome("")
    setFerramentasEnabled(true)
    setPercentualVendedor(20)
    setPercentualProprietario(10)
    setDialogOpen(true)
  }

  function openEditDialog(vendedor: Vendedor) {
    setEditingId(vendedor.id)
    setNome(vendedor.nome)
    setFerramentasEnabled(vendedor.ferramentasEnabled)
    setPercentualVendedor(vendedor.percentualVendedor)
    setPercentualProprietario(vendedor.percentualProprietario)
    setDialogOpen(true)
  }

  function handleSave() {
    if (!nome.trim()) return

    const config = {
      ferramentasEnabled,
      percentualVendedor,
      percentualProprietario,
    }

    if (!validateDistribution(config as unknown as Vendedor)) return

    if (editingId) {
      const existing = vendedores.find((v) => v.id === editingId)
      if (existing) {
        update({
          ...existing,
          nome: nome.trim(),
          ferramentasEnabled,
          percentualVendedor,
          percentualProprietario,
        })
      }
    } else {
      add({
        id: crypto.randomUUID(),
        nome: nome.trim(),
        createdAt: new Date().toISOString(),
        ferramentasEnabled,
        percentualVendedor,
        percentualProprietario,
      })
    }

    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    remove(id)
    setDeleteConfirmId(null)
  }

  const totalDist =
    EMPRESA_PERCENTUAL +
    (ferramentasEnabled ? FERRAMENTAS_PERCENTUAL : 0) +
    percentualVendedor +
    percentualProprietario

  const isValid = totalDist === 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pontes</h1>
          <p className="text-muted-foreground">
            Gerencie seus pontes e configurações de comissão.
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo ponte
        </Button>
      </div>

      {vendedores.length === 0 ? (
        <EmptyState onAdd={openNewDialog} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ponte</TableHead>
                    <TableHead className="text-center">Ferramentas</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      % Ponte
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      % Proprietário
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      Total Vendido
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Total Ponte
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      Total Proprietário
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map((v) => {
                    const vendasDoVendedor = vendas.filter(
                      (ve) => ve.vendedorId === v.id
                    )
                    const st = calculateSellerTotals(v, vendasDoVendedor)
                    return (
                      <TableRow
                        key={v.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/vendedores/${v.id}`)}
                      >
                        <TableCell className="font-medium">
                          {v.nome} - Ponte
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={v.ferramentasEnabled ? "default" : "secondary"}>
                            {v.ferramentasEnabled ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {v.percentualVendedor}%
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          {v.percentualProprietario}%
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell font-medium">
                          {formatCurrency(st.totalVendido)}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {formatCurrency(st.totalVendedor)}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {formatCurrency(st.totalProprietario)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/vendedores/${v.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(v)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmId(v.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar ponte" : "Novo ponte"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do ponte</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Claudio"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Utiliza ferramentas</Label>
                <p className="text-xs text-muted-foreground">
                  {ferramentasEnabled
                    ? "Ferramentas: 10% da distribuição"
                    : "Sem ferramentas na distribuição"}
                </p>
              </div>
              <Switch
                checked={ferramentasEnabled}
                onCheckedChange={setFerramentasEnabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pv">% Ponte</Label>
                <Input
                  id="pv"
                  type="number"
                  min={0}
                  max={100}
                  value={percentualVendedor}
                  onChange={(e) =>
                    setPercentualVendedor(Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pp">% Proprietário</Label>
                <Input
                  id="pp"
                  type="number"
                  min={0}
                  max={100}
                  value={percentualProprietario}
                  onChange={(e) =>
                    setPercentualProprietario(Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Distribution preview */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Distribuição:
              </p>
              <div className="flex justify-between text-sm">
                <span>Empresa</span>
                <span className="font-medium">{EMPRESA_PERCENTUAL}%</span>
              </div>
              {ferramentasEnabled && (
                <div className="flex justify-between text-sm">
                  <span>Ferramentas</span>
                  <span className="font-medium">{FERRAMENTAS_PERCENTUAL}%</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Ponte</span>
                <span className="font-medium">{percentualVendedor}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Proprietário</span>
                <span className="font-medium">{percentualProprietario}%</span>
              </div>
              <div className="border-t pt-1.5 mt-1.5">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className={isValid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                    {totalDist}% {isValid ? "✓" : "⚠"}
                  </span>
                </div>
                {!isValid && (
                  <p className="text-xs text-destructive mt-1">
                    Os percentuais precisam totalizar 100%.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!nome.trim() || !isValid}>
              {editingId ? "Salvar alterações" : "Salvar ponte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir ponte</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este ponte? Todas as vendas
            associadas também serão removidas. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nenhum ponte cadastrado</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        Cadastre seu primeiro ponte para começar a acompanhar suas vendas.
      </p>
      <Button className="mt-6" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar ponte
      </Button>
    </div>
  )
}
