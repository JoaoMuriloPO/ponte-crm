import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  getGitHubAuthUrl,
  exchangeCodeForToken,
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
  loginWithGitHub: () => void
  handleCallback: (code: string) => Promise<boolean>
  logout: () => void
  syncToGist: () => Promise<boolean>
  loadFromGist: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY_TOKEN = "crm_github_token"
const STORAGE_KEY_USER = "crm_github_user"
const STORAGE_KEY_GIST = "crm_gist_id"
const STORAGE_KEY_SYNC = "crm_last_sync"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [gistId, setGistId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Auto-login from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedUser = localStorage.getItem(STORAGE_KEY_USER)
    const savedGist = localStorage.getItem(STORAGE_KEY_GIST)
    const savedSync = localStorage.getItem(STORAGE_KEY_SYNC)

    if (savedSync) setLastSync(savedSync)

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        setGistId(savedGist)
      } catch {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_USER)
        localStorage.removeItem(STORAGE_KEY_GIST)
      }
    }
  }, [])

  const loginWithGitHub = useCallback(() => {
    const url = getGitHubAuthUrl()
    window.location.href = url
  }, [])

  const handleCallback = useCallback(async (code: string): Promise<boolean> => {
    const result = await exchangeCodeForToken(code)
    if (!result) return false

    setUser(result.user)
    setToken(result.access_token)
    localStorage.setItem(STORAGE_KEY_TOKEN, result.access_token)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user))

    // Find or create gist
    const gId = await findOrCreateGist(result.access_token)
    setGistId(gId)
    localStorage.setItem(STORAGE_KEY_GIST, gId)

    // Auto-load data from gist
    setIsSyncing(true)
    try {
      const data = await loadGistData(result.access_token, gId)
      if (data) {
        localStorage.setItem("crm_vendedores", JSON.stringify(data.vendedores))
        localStorage.setItem("crm_vendas", JSON.stringify(data.vendas))
        localStorage.setItem("crm_configuracoes", JSON.stringify(data.configuracoes))
        const now = new Date().toISOString()
        setLastSync(now)
        localStorage.setItem(STORAGE_KEY_SYNC, now)
        window.dispatchEvent(new Event("crm-data-synced"))
      }
    } finally {
      setIsSyncing(false)
    }

    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setGistId(null)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
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

      localStorage.setItem("crm_vendedores", JSON.stringify(data.vendedores))
      localStorage.setItem("crm_vendas", JSON.stringify(data.vendas))
      localStorage.setItem("crm_configuracoes", JSON.stringify(data.configuracoes))

      const now = new Date().toISOString()
      setLastSync(now)
      localStorage.setItem(STORAGE_KEY_SYNC, now)
      window.dispatchEvent(new Event("crm-data-synced"))
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
        loginWithGitHub,
        handleCallback,
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
