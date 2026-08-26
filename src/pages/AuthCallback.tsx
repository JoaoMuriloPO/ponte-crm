import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()
  const [status, setStatus] = useState<"loading" | "syncing" | "success" | "error">("loading")

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      return
    }

    if (!code) {
      setStatus("error")
      return
    }

    handleCallback(code).then((ok) => {
      if (ok) {
        setStatus("syncing")
        setTimeout(() => {
          setStatus("success")
          setTimeout(() => navigate("/configuracoes"), 1000)
        }, 500)
      } else {
        setStatus("error")
      }
    })
  }, [searchParams, handleCallback, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg border bg-card">
        {status === "loading" && (
          <>
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Conectando com GitHub...</p>
          </>
        )}
        {status === "syncing" && (
          <>
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium">Carregando seus dados...</p>
            <p className="text-xs text-muted-foreground">Sincronizando com a nuvem</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium">Conectado com sucesso!</p>
            <p className="text-xs text-muted-foreground">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">Erro ao conectar</p>
            <p className="text-xs text-muted-foreground">
              Tente novamente ou verifique as permissões do app.
            </p>
            <button
              onClick={() => navigate("/configuracoes")}
              className="mt-2 text-sm text-primary underline"
            >
              Voltar para configurações
            </button>
          </>
        )}
      </div>
    </div>
  )
}
