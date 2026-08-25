import { useState } from "react"
import { Settings, Save, RotateCcw, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getConfiguracoes, saveConfiguracoes, clearAllData } from "@/services/storage/localStorageService"
import { useVendedores } from "@/hooks/useVendedores"
import { useVendas } from "@/hooks/useVendas"

export default function Configuracoes() {
  const config = getConfiguracoes()
  const [nomeProprietario, setNomeProprietario] = useState(config.nomeProprietario)
  const [saved, setSaved] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const { refresh: refreshVendedores } = useVendedores()
  const { refresh: refreshVendas } = useVendas()

  function handleSave() {
    if (!nomeProprietario.trim()) return
    saveConfiguracoes({ nomeProprietario: nomeProprietario.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClearData() {
    clearAllData()
    setClearDialogOpen(false)
    refreshVendedores()
    refreshVendas()
    setNomeProprietario("Proprietário")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil do Proprietário</CardTitle>
          <CardDescription>
            Informações básicas do proprietário da conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome">Nome do proprietário</Label>
              <Input
                id="nome"
                value={nomeProprietario}
                onChange={(e) => setNomeProprietario(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <Button onClick={handleSave} disabled={!nomeProprietario.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {saved ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados</CardTitle>
          <CardDescription>
            Gerencie os dados armazenados no navegador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Dados de demonstração</p>
              <p className="text-xs text-muted-foreground">
                Carrega pontes e vendas de exemplo para testes.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                import("@/lib/demo-data").then((m) => {
                  m.loadDemoData()
                  refreshVendedores()
                  refreshVendas()
                  setNomeProprietario("João Murilo")
                })
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Carregar demo
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">
                Limpar todos os dados
              </p>
              <p className="text-xs text-muted-foreground">
                Remove todos os pontes, vendas e configurações. Ação irreversível.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar dados
            </Button>
          </div>

          {/* About */}
          <div className="rounded-lg bg-muted/50 p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Sobre o sistema</p>
            </div>
            <p className="text-xs text-muted-foreground">
              CRM Financeiro v1.0 — Sistema de controle financeiro de vendas para
              proprietários e pontes. Todos os dados são armazenados localmente
              no navegador.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Confirmation */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Limpar todos os dados</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação removerá todos os pontes, vendas e configurações
            armazenados. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Limpar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
