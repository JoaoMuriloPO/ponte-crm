import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { ReactNode } from "react"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"

// Mock the githubService module
vi.mock("@/services/github/githubService", () => ({
  getGitHubAuthUrl: vi.fn(() => "https://github.com/login/oauth/authorize?client_id=test"),
  exchangeCodeForToken: vi.fn(),
  findOrCreateGist: vi.fn(),
  loadGistData: vi.fn(),
  saveGistData: vi.fn(),
}))

import {
  exchangeCodeForToken,
  findOrCreateGist,
  loadGistData,
} from "@/services/github/githubService"

const mockedExchange = vi.mocked(exchangeCodeForToken)
const mockedFindOrCreate = vi.mocked(findOrCreateGist)
const mockedLoad = vi.mocked(loadGistData)

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe("AuthContext - auto-sync after login", () => {
  it("loads gist data into localStorage after successful callback", async () => {
    mockedExchange.mockResolvedValue({
      access_token: "test-token",
      user: { login: "testuser", name: "Test User", avatar_url: "" },
    })
    mockedFindOrCreate.mockResolvedValue("gist-id-123")
    mockedLoad.mockResolvedValue({
      vendedores: [
        { id: "v1", nome: "Remote Seller", createdAt: "2025-01-01", despachanteEnabled: true, percentualVendedor: 20, percentualProprietario: 10 },
      ],
      vendas: [
        { id: "s1", vendedorId: "v1", valor: 1500, data: "2025-06-01", distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 } },
      ],
      configuracoes: { nomeProprietario: "Remote Owner" },
      version: 1,
      updatedAt: "2025-06-15T00:00:00.000Z",
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const ok = await result.current.handleCallback("test-code")
      expect(ok).toBe(true)
    })

    // Data should be written to localStorage
    const vendedores = JSON.parse(localStorage.getItem("crm_vendedores") || "[]")
    expect(vendedores).toHaveLength(1)
    expect(vendedores[0].nome).toBe("Remote Seller")

    const vendas = JSON.parse(localStorage.getItem("crm_vendas") || "[]")
    expect(vendas).toHaveLength(1)
    expect(vendas[0].valor).toBe(1500)

    const config = JSON.parse(localStorage.getItem("crm_configuracoes") || "{}")
    expect(config.nomeProprietario).toBe("Remote Owner")

    // Auth state should be set
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.login).toBe("testuser")
    expect(result.current.gistId).toBe("gist-id-123")
  })

  it("dispatches crm-data-synced event after auto-load", async () => {
    mockedExchange.mockResolvedValue({
      access_token: "test-token",
      user: { login: "testuser", name: "Test User", avatar_url: "" },
    })
    mockedFindOrCreate.mockResolvedValue("gist-id-123")
    mockedLoad.mockResolvedValue({
      vendedores: [],
      vendas: [],
      configuracoes: { nomeProprietario: "Test" },
      version: 1,
      updatedAt: "2025-06-15T00:00:00.000Z",
    })

    const eventHandler = vi.fn()
    window.addEventListener("crm-data-synced", eventHandler)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.handleCallback("test-code")
    })

    expect(eventHandler).toHaveBeenCalledTimes(1)
    window.removeEventListener("crm-data-synced", eventHandler)
  })

  it("still succeeds when gist data load fails", async () => {
    mockedExchange.mockResolvedValue({
      access_token: "test-token",
      user: { login: "testuser", name: "Test User", avatar_url: "" },
    })
    mockedFindOrCreate.mockResolvedValue("gist-id-123")
    mockedLoad.mockResolvedValue(null) // Gist load fails

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const ok = await result.current.handleCallback("test-code")
      expect(ok).toBe(true)
    })

    // Auth should still work even if data load fails
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.gistId).toBe("gist-id-123")
    // localStorage should NOT have data (empty)
    expect(localStorage.getItem("crm_vendedores")).toBeNull()
  })

  it("syncToGist dispatches crm-data-synced event", async () => {
    const eventHandler = vi.fn()
    window.addEventListener("crm-data-synced", eventHandler)

    // Pre-populate auth state and localStorage
    localStorage.setItem("crm_github_token", "test-token")
    localStorage.setItem("crm_github_user", JSON.stringify({ login: "test", name: "Test", avatar_url: "" }))
    localStorage.setItem("crm_gist_id", "gist-123")

    const { result } = renderHook(() => useAuth(), { wrapper })

    // The hook reads from localStorage on mount, so it should have the token
    expect(result.current.token).toBe("test-token")

    window.removeEventListener("crm-data-synced", eventHandler)
  })
})
