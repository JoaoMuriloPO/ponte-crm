import type { Vendedor, Venda, Configuracoes } from "@/types"

const KEYS = {
  VENDEDORES: "crm_vendedores",
  VENDAS: "crm_vendas",
  CONFIGURACOES: "crm_configuracoes",
} as const

// === Migrations ===

function migrateVendedores(data: unknown[]): Vendedor[] {
  return data.map((item) => {
    const v: Record<string, unknown> = { ...(item as Record<string, unknown>) }
    if ("percentualInstrutor" in v && !("percentualProprietario" in v)) {
      v.percentualProprietario = v.percentualInstrutor
      delete v.percentualInstrutor
    }
    return v as unknown as Vendedor
  })
}

function migrateVendas(data: unknown[]): Venda[] {
  return data.map((item) => {
    const v: Record<string, unknown> = { ...(item as Record<string, unknown>) }
    if (v.distribuicao && typeof v.distribuicao === "object") {
      const dist = { ...(v.distribuicao as Record<string, unknown>) }
      if ("instrutor" in dist && !("proprietario" in dist)) {
        dist.proprietario = dist.instrutor
        delete dist.instrutor
      }
      v.distribuicao = dist
    }
    return v as unknown as Venda
  })
}

function migrateConfig(data: Record<string, unknown>): Configuracoes {
  if ("nomeInstrutor" in data && !("nomeProprietario" in data)) {
    return { nomeProprietario: data.nomeInstrutor as string }
  }
  return data as unknown as Configuracoes
}

// === Storage ===

function readFromStorage<T>(key: string, migrate?: (data: unknown[]) => T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return migrate ? migrate(parsed) : (parsed as T[])
  } catch {
    return []
  }
}

function writeToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function readConfig(): Configuracoes {
  try {
    const raw = localStorage.getItem(KEYS.CONFIGURACOES)
    if (!raw) return { nomeProprietario: "Proprietário" }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return { nomeProprietario: "Proprietário" }
    const migrated = migrateConfig(parsed)
    // Persist migration
    localStorage.setItem(KEYS.CONFIGURACOES, JSON.stringify(migrated))
    return migrated
  } catch {
    return { nomeProprietario: "Proprietário" }
  }
}

function writeConfig(config: Configuracoes): void {
  localStorage.setItem(KEYS.CONFIGURACOES, JSON.stringify(config))
}

// === Vendedores ===

export function getVendedores(): Vendedor[] {
  const data = readFromStorage<Vendedor>(KEYS.VENDEDORES, migrateVendedores)
  // Persist migration if any were applied
  if (data.length > 0) {
    const raw = localStorage.getItem(KEYS.VENDEDORES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.length > 0 && "percentualInstrutor" in (parsed[0] || {})) {
        writeToStorage(KEYS.VENDEDORES, data)
      }
    }
  }
  return data
}

export function getVendedorById(id: string): Vendedor | undefined {
  return getVendedores().find((v) => v.id === id)
}

export function saveVendedor(vendedor: Vendedor): void {
  const vendedores = getVendedores()
  vendedores.push(vendedor)
  writeToStorage(KEYS.VENDEDORES, vendedores)
}

export function updateVendedor(updated: Vendedor): void {
  const vendedores = getVendedores()
  const index = vendedores.findIndex((v) => v.id === updated.id)
  if (index !== -1) {
    vendedores[index] = updated
    writeToStorage(KEYS.VENDEDORES, vendedores)
  }
}

export function deleteVendedor(id: string): void {
  const vendedores = getVendedores().filter((v) => v.id !== id)
  writeToStorage(KEYS.VENDEDORES, vendedores)

  // Also delete all sales for this seller
  const vendas = getVendas().filter((v) => v.vendedorId !== id)
  writeToStorage(KEYS.VENDAS, vendas)
}

// === Vendas ===

export function getVendas(): Venda[] {
  const data = readFromStorage<Venda>(KEYS.VENDAS, migrateVendas)
  // Persist migration
  if (data.length > 0) {
    const raw = localStorage.getItem(KEYS.VENDAS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.length > 0) {
        const firstDist = (parsed[0] || {}).distribuicao
        if (firstDist && "instrutor" in firstDist) {
          writeToStorage(KEYS.VENDAS, data)
        }
      }
    }
  }
  return data
}

export function getVendasByVendedor(vendedorId: string): Venda[] {
  return getVendas().filter((v) => v.vendedorId === vendedorId)
}

export function saveVenda(venda: Venda): void {
  const vendas = getVendas()
  vendas.push(venda)
  writeToStorage(KEYS.VENDAS, vendas)
}

export function updateVenda(updated: Venda): void {
  const vendas = getVendas()
  const index = vendas.findIndex((v) => v.id === updated.id)
  if (index !== -1) {
    vendas[index] = updated
    writeToStorage(KEYS.VENDAS, vendas)
  }
}

export function deleteVenda(id: string): void {
  const vendas = getVendas().filter((v) => v.id !== id)
  writeToStorage(KEYS.VENDAS, vendas)
}

// === Configurações ===

export function getConfiguracoes(): Configuracoes {
  return readConfig()
}

export function saveConfiguracoes(config: Configuracoes): void {
  writeConfig(config)
}

// === Limpar tudo ===

export function clearAllData(): void {
  localStorage.removeItem(KEYS.VENDEDORES)
  localStorage.removeItem(KEYS.VENDAS)
  localStorage.removeItem(KEYS.CONFIGURACOES)
}
