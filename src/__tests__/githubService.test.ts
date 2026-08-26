import { describe, it, expect, vi, beforeEach } from "vitest"
import type { GistData } from "@/services/github/githubService"

const mockGists = {
  list: vi.fn(),
  create: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
}

class MockOctokit {
  gists = mockGists
  paginate = vi.fn((fn: unknown) => (fn as () => unknown)())
  constructor(_opts?: Record<string, unknown>) {}
}

vi.mock("@octokit/rest", () => ({
  Octokit: MockOctokit,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("githubService", () => {
  describe("getGitHubAuthUrl", () => {
    it("returns a valid GitHub OAuth URL", async () => {
      vi.stubEnv("VITE_GITHUB_CLIENT_ID", "test-client-id")
      const { getGitHubAuthUrl } = await import("@/services/github/githubService")
      const url = getGitHubAuthUrl()
      expect(url).toContain("github.com/login/oauth/authorize")
      expect(url).toContain("client_id=test-client-id")
      expect(url).toContain("scope=gist")
    })
  })

  describe("findOrCreateGist", () => {
    it("returns existing gist ID when found", async () => {
      mockGists.list.mockResolvedValue([
        {
          id: "existing-gist-id",
          description: "Ponte CRM - Dados",
          files: { "ponte-crm-data.json": { content: "{}" } },
        },
      ])

      const { findOrCreateGist } = await import("@/services/github/githubService")
      const result = await findOrCreateGist("fake-token")
      expect(result).toBe("existing-gist-id")
    })

    it("creates new gist when none found", async () => {
      mockGists.list.mockResolvedValue([])
      mockGists.create.mockResolvedValue({ data: { id: "new-gist-id" } })

      const { findOrCreateGist } = await import("@/services/github/githubService")
      const result = await findOrCreateGist("fake-token")
      expect(result).toBe("new-gist-id")
      expect(mockGists.create).toHaveBeenCalledOnce()
    })
  })

  describe("loadGistData", () => {
    it("parses gist data correctly", async () => {
      const gistData: GistData = {
        vendedores: [{ id: "v1", nome: "Test" }],
        vendas: [{ id: "s1", vendedorId: "v1", valor: 500 }],
        configuracoes: { nomeProprietario: "Owner" },
        version: 1,
        updatedAt: "2025-01-01T00:00:00.000Z",
      }
      mockGists.get.mockResolvedValue({
        data: {
          files: {
            "ponte-crm-data.json": { content: JSON.stringify(gistData) },
          },
        },
      })

      const { loadGistData } = await import("@/services/github/githubService")
      const result = await loadGistData("token", "gist-id")
      expect(result).toEqual(gistData)
    })

    it("returns null on error", async () => {
      mockGists.get.mockRejectedValue(new Error("Not found"))

      const { loadGistData } = await import("@/services/github/githubService")
      const result = await loadGistData("token", "nonexistent")
      expect(result).toBeNull()
    })

    it("returns null when file not found", async () => {
      mockGists.get.mockResolvedValue({
        data: { files: {} },
      })

      const { loadGistData } = await import("@/services/github/githubService")
      const result = await loadGistData("token", "gist-id")
      expect(result).toBeNull()
    })
  })

  describe("saveGistData", () => {
    it("saves data to gist", async () => {
      mockGists.update.mockResolvedValue({})

      const { saveGistData } = await import("@/services/github/githubService")
      const data: GistData = {
        vendedores: [],
        vendas: [],
        configuracoes: { nomeProprietario: "Test" },
        version: 1,
        updatedAt: "2025-01-01T00:00:00.000Z",
      }
      const result = await saveGistData("token", "gist-id", data)
      expect(result).toBe(true)
      expect(mockGists.update).toHaveBeenCalledWith({
        gist_id: "gist-id",
        files: {
          "ponte-crm-data.json": {
            content: JSON.stringify(data, null, 2),
          },
        },
      })
    })

    it("returns false on error", async () => {
      mockGists.update.mockRejectedValue(new Error("Write failed"))

      const { saveGistData } = await import("@/services/github/githubService")
      const data: GistData = {
        vendedores: [],
        vendas: [],
        configuracoes: {},
        version: 1,
        updatedAt: "2025-01-01T00:00:00.000Z",
      }
      const result = await saveGistData("token", "gist-id", data)
      expect(result).toBe(false)
    })
  })
})
