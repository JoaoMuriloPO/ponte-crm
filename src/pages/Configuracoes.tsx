import { useState } from "react"
import { Settings, Save, RotateCcw, Download, LogOut, Cloud, RefreshCw, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { useAuth } from "@/contexts/AuthContext"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

export default function Configuracoes() {
  const config = getConfiguracoes()
  const [nomeProprietario, setNomeProprietario] = useState(config.nomeProprietario)
  const [saved, setSaved] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const {
    user,
    isAuthenticated,
    isSyncing,
    lastSync,
    loginWithGitHub,
    logout,
    syncToGist,
    loadFromGist,
  } = useAuth()

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

      {/* GitHub Auth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitHubIcon className="h-5 w-5" />
            Conta GitHub
          </CardTitle>
          <CardDescription>
            Conecte sua conta GitHub para sincronizar dados via Gist privado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-2">Como funciona:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Clique em "Conectar com GitHub"</li>
                  <li>Você será redirecionado para o GitHub autorizar o app</li>
                  <li>Após autorizar, seus dados serão vinculados à sua conta</li>
                  <li>Um Gist privado será criado automaticamente para armazenar seus dados</li>
                </ol>
              </div>
              <Button onClick={loginWithGitHub} size="lg" className="w-full">
                <GitHubIcon className="mr-2 h-5 w-5" />
                Conectar com GitHub
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                {user && (
                  <>
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">@{user.login}</p>
                    </div>
                  </>
                )}
                <Badge variant="default" className="bg-emerald-600 dark:bg-emerald-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Sync controls */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Sincronização via Gist</p>
                  <p className="text-xs text-muted-foreground">
                    {lastSync
                      ? `Último sync: ${new Date(lastSync).toLocaleString("pt-BR")}`
                      : "Nenhum sync realizado ainda"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await syncToGist()
                      refreshVendedores()
                      refreshVendas()
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Cloud className="h-4 w-4 mr-1" />
                    )}
                    Salvar na nuvem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await loadFromGist()
                      refreshVendedores()
                      refreshVendas()
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Carregar da nuvem
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

          <div className="rounded-lg bg-muted/50 p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Sobre o sistema</p>
            </div>
            <p className="text-xs text-muted-foreground">
              CRM Financeiro v1.1 — Sistema de controle financeiro de vendas para
              proprietários e pontes. Dados armazenados localmente com opção de
              sincronização via GitHub Gist.
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
