import { Octokit } from "@octokit/rest"

const GIST_DESCRIPTION = "Ponte CRM - Dados"
const GIST_FILENAME = "ponte-crm-data.json"

export interface GistData {
  vendedores: unknown[]
  vendas: unknown[]
  configuracoes: Record<string, unknown>
  version: number
  updatedAt: string
}

export interface GitHubUser {
  login: string
  name: string
  avatar_url: string
}

// === OAuth Flow ===

export function getGitHubAuthUrl(): string {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const redirectUri = `${window.location.origin}/auth/callback`
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=gist`
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; user: GitHubUser } | null> {
  try {
    const res = await fetch("/api/auth/github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// === Gist Operations ===

function getOctokit(token: string): Octokit {
  return new Octokit({ auth: token })
}

export async function findOrCreateGist(token: string): Promise<string> {
  const octokit = getOctokit(token)

  // Search through user's gists
  try {
    const gists = await octokit.paginate(octokit.gists.list, {
      per_page: 100,
    })

    for (const gist of gists) {
      if (gist.description === GIST_DESCRIPTION && gist.files[GIST_FILENAME]) {
        return gist.id
      }
    }
  } catch {
    // Continue to create
  }

  // Create new gist
  const initialData: GistData = {
    vendedores: [],
    vendas: [],
    configuracoes: { nomeProprietario: "Proprietário" },
    version: 1,
    updatedAt: new Date().toISOString(),
  }

  const { data } = await octokit.gists.create({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(initialData, null, 2),
      },
    },
  })

  return data.id || ""
}

export async function loadGistData(token: string, gistId: string): Promise<GistData | null> {
  try {
    const octokit = getOctokit(token)
    const { data } = await octokit.gists.get({ gist_id: gistId })
    if (!data.files) return null
    const file = data.files[GIST_FILENAME]
    if (!file || !file.content) return null
    return JSON.parse(file.content) as GistData
  } catch {
    return null
  }
}

export async function saveGistData(
  token: string,
  gistId: string,
  data: GistData
): Promise<boolean> {
  try {
    const octokit = getOctokit(token)
    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    })
    return true
  } catch {
    return false
  }
}
