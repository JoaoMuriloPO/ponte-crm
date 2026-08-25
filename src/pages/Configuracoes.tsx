import { useState } from "react"
import { Settings, Save, RotateCcw, Download, LogIn, LogOut, User, Cloud, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
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

export default function Configuracoes() {
  const config = getConfiguracoes()
  const [nomeProprietario, setNomeProprietario] = useState(config.nomeProprietario)
  const [saved, setSaved] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  // Auth
  const {
    user,
    isAuthenticated,
    isSyncing,
    lastSync,
    login,
    logout,
    syncToGist,
    loadFromGist,
  } = useAuth()

  const [tokenInput, setTokenInput] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const { refresh: refreshVendedores } = useVendedores()
  const { refresh: refreshVendas } = useVendas()

  function handleSave() {
    if (!nomeProprietario.trim()) return
    saveConfiguracoes({ nomeProprietario: nomeProprietario.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogin() {
    if (!tokenInput.trim()) return
    setLoginLoading(true)
    setLoginError("")
    try {
      const ok = await login(tokenInput.trim())
      if (!ok) {
        setLoginError("Token inválido. Verifique se o token possui permissão 'gist'.")
      }
      setTokenInput("")
    } catch {
      setLoginError("Erro ao conectar com GitHub. Tente novamente.")
    } finally {
      setLoginLoading(false)
    }
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
            <User className="h-5 w-5" />
            GitHub
          </CardTitle>
          <CardDescription>
            Conecte sua conta GitHub para sincronizar dados via Gist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-2">Como obter um Personal Access Token:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Acesse <span className="font-mono">github.com/settings/tokens</span></li>
                  <li>Clique em "Generate new token (classic)"</li>
                  <li>Dê um nome (ex: "Ponte CRM")</li>
                  <li>Marque a permissão <span className="font-semibold">gist</span></li>
                  <li>Clique em "Generate token" e copie</li>
                </ol>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="token">Personal Access Token</Label>
                  <Input
                    id="token"
                    type="password"
                    value={tokenInput}
                    onChange={(e) => { setTokenInput(e.target.value); setLoginError("") }}
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  {loginError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {loginError}
                    </p>
                  )}
                </div>
                <Button onClick={handleLogin} disabled={!tokenInput.trim() || loginLoading}>
                  {loginLoading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Conectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {user && (
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
                <Badge variant="default" className="bg-emerald-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              )}

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

          {/* About */}
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
