import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  validateToken,
  findOrCreateGist,
  loadGistData,
  saveGistData,
  type GitHubUser,
  type GistData,
} from "@/services/github/githubService"
import { getVendedores, getVendas, getConfiguracoes } from "@/services/storage/localStorageService"

interface AuthContextType {
  user: GitHubUser | null
  token: string | null
  gistId: string | null
  isAuthenticated: boolean
  isSyncing: boolean
  lastSync: string | null
  login: (token: string) => Promise<boolean>
  logout: () => void
  syncToGist: () => Promise<boolean>
  loadFromGist: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY_TOKEN = "crm_github_token"
const STORAGE_KEY_GIST = "crm_gist_id"
const STORAGE_KEY_SYNC = "crm_last_sync"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [gistId, setGistId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Auto-login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedGist = localStorage.getItem(STORAGE_KEY_GIST)
    const savedSync = localStorage.getItem(STORAGE_KEY_SYNC)

    if (savedSync) setLastSync(savedSync)

    if (savedToken) {
      validateToken(savedToken).then((u) => {
        if (u) {
          setUser(u)
          setToken(savedToken)
          setGistId(savedGist)
        } else {
          // Token invalid, clear
          localStorage.removeItem(STORAGE_KEY_TOKEN)
          localStorage.removeItem(STORAGE_KEY_GIST)
        }
      })
    }
  }, [])

  const login = useCallback(async (newToken: string): Promise<boolean> => {
    const u = await validateToken(newToken)
    if (!u) return false

    setUser(u)
    setToken(newToken)
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken)

    // Find or create gist
    const gId = await findOrCreateGist(newToken)
    setGistId(gId)
    localStorage.setItem(STORAGE_KEY_GIST, gId)

    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setGistId(null)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_GIST)
  }, [])

  const syncToGist = useCallback(async (): Promise<boolean> => {
    if (!token || !gistId) return false
    setIsSyncing(true)
    try {
      const data: GistData = {
        vendedores: getVendedores(),
        vendas: getVendas(),
        configuracoes: getConfiguracoes() as unknown as Record<string, unknown>,
        version: 1,
        updatedAt: new Date().toISOString(),
      }
      const ok = await saveGistData(token, gistId, data)
      if (ok) {
        const now = new Date().toISOString()
        setLastSync(now)
        localStorage.setItem(STORAGE_KEY_SYNC, now)
      }
      return ok
    } finally {
      setIsSyncing(false)
    }
  }, [token, gistId])

  const loadFromGist = useCallback(async (): Promise<boolean> => {
    if (!token || !gistId) return false
    setIsSyncing(true)
    try {
      const data = await loadGistData(token, gistId)
      if (!data) return false

      // Save to localStorage
      localStorage.setItem("crm_vendedores", JSON.stringify(data.vendedores))
      localStorage.setItem("crm_vendas", JSON.stringify(data.vendas))
      localStorage.setItem("crm_configuracoes", JSON.stringify(data.configuracoes))

      const now = new Date().toISOString()
      setLastSync(now)
      localStorage.setItem(STORAGE_KEY_SYNC, now)
      return true
    } finally {
      setIsSyncing(false)
    }
  }, [token, gistId])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        gistId,
        isAuthenticated: !!user,
        isSyncing,
        lastSync,
        login,
        logout,
        syncToGist,
        loadFromGist,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
