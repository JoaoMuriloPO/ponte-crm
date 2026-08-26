import { describe, it, expect, beforeEach } from "vitest"
import {
  getVendedores,
  saveVendedor,
  updateVendedor,
  deleteVendedor,
  getVendedorById,
  getVendas,
  saveVenda,
  updateVenda,
  deleteVenda,
  getVendasByVendedor,
  getConfiguracoes,
  saveConfiguracoes,
  clearAllData,
} from "@/services/storage/localStorageService"
import type { Vendedor, Venda } from "@/types"

beforeEach(() => {
  localStorage.clear()
})

function makeVendedor(overrides: Partial<Vendedor> = {}): Vendedor {
  return {
    id: "v1",
    nome: "João",
    createdAt: "2025-01-01T00:00:00.000Z",
    despachanteEnabled: true,
    percentualVendedor: 20,
    percentualProprietario: 10,
    ...overrides,
  }
}

function makeVenda(overrides: Partial<Venda> = {}): Venda {
  return {
    id: "sale1",
    vendedorId: "v1",
    valor: 1000,
    data: "2025-06-15T12:00:00.000Z",
    distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
    ...overrides,
  }
}

describe("Vendedores CRUD", () => {
  it("returns empty array when no data", () => {
    expect(getVendedores()).toEqual([])
  })

  it("saves and retrieves a vendedor", () => {
    const v = makeVendedor()
    saveVendedor(v)
    expect(getVendedores()).toHaveLength(1)
    expect(getVendedores()[0].nome).toBe("João")
  })

  it("finds vendedor by id", () => {
    saveVendedor(makeVendedor({ id: "v1" }))
    saveVendedor(makeVendedor({ id: "v2", nome: "Maria" }))
    expect(getVendedorById("v2")?.nome).toBe("Maria")
  })

  it("returns undefined for non-existent id", () => {
    expect(getVendedorById("nonexistent")).toBeUndefined()
  })

  it("updates a vendedor", () => {
    saveVendedor(makeVendedor({ id: "v1", nome: "João" }))
    updateVendedor(makeVendedor({ id: "v1", nome: "João Updated" }))
    expect(getVendedores()[0].nome).toBe("João Updated")
  })

  it("deletes a vendedor and its vendas", () => {
    saveVendedor(makeVendedor({ id: "v1" }))
    saveVenda(makeVenda({ id: "s1", vendedorId: "v1" }))
    saveVenda(makeVenda({ id: "s2", vendedorId: "v2" }))
    deleteVendedor("v1")
    expect(getVendedores()).toHaveLength(0)
    expect(getVendas()).toHaveLength(1)
    expect(getVendas()[0].id).toBe("s2")
  })

  it("migrates percentualInstrutor to percentualProprietario", () => {
    const legacyData = [{ id: "v1", nome: "Old", createdAt: "2025-01-01", percentualInstrutor: 15, percentualVendedor: 25, ferramentasEnabled: true }]
    localStorage.setItem("crm_vendedores", JSON.stringify(legacyData))
    const result = getVendedores()
    expect(result[0].percentualProprietario).toBe(15)
    expect(result[0].despachanteEnabled).toBe(true)
    expect(result[0]).not.toHaveProperty("percentualInstrutor")
    expect(result[0]).not.toHaveProperty("ferramentasEnabled")
  })
})

describe("Vendas CRUD", () => {
  it("returns empty array when no data", () => {
    expect(getVendas()).toEqual([])
  })

  it("saves and retrieves a venda", () => {
    saveVenda(makeVenda())
    expect(getVendas()).toHaveLength(1)
  })

  it("filters vendas by vendedor", () => {
    saveVenda(makeVenda({ id: "s1", vendedorId: "v1" }))
    saveVenda(makeVenda({ id: "s2", vendedorId: "v2" }))
    saveVenda(makeVenda({ id: "s3", vendedorId: "v1" }))
    expect(getVendasByVendedor("v1")).toHaveLength(2)
    expect(getVendasByVendedor("v2")).toHaveLength(1)
  })

  it("updates a venda", () => {
    saveVenda(makeVenda({ id: "s1", valor: 100 }))
    updateVenda(makeVenda({ id: "s1", valor: 200 }))
    expect(getVendas()[0].valor).toBe(200)
  })

  it("deletes a venda", () => {
    saveVenda(makeVenda({ id: "s1" }))
    saveVenda(makeVenda({ id: "s2" }))
    deleteVenda("s1")
    expect(getVendas()).toHaveLength(1)
  })

  it("migrates instrutor to proprietario in distribuicao", () => {
    const legacyData = [{
      id: "s1", vendedorId: "v1", valor: 1000, data: "2025-01-01",
      distribuicao: { empresa: 60, ferramentas: 10, vendedor: 20, instrutor: 10 },
    }]
    localStorage.setItem("crm_vendas", JSON.stringify(legacyData))
    const result = getVendas()
    expect(result[0].distribuicao.proprietario).toBe(10)
    expect(result[0].distribuicao.despachante).toBe(10)
    expect(result[0].distribuicao).not.toHaveProperty("instrutor")
    expect(result[0].distribuicao).not.toHaveProperty("ferramentas")
  })
})

describe("Configuracoes", () => {
  it("returns default config", () => {
    expect(getConfiguracoes()).toEqual({ nomeProprietario: "Proprietário" })
  })

  it("saves and retrieves config", () => {
    saveConfiguracoes({ nomeProprietario: "Maria" })
    expect(getConfiguracoes().nomeProprietario).toBe("Maria")
  })

  it("migrates nomeInstrutor to nomeProprietario", () => {
    localStorage.setItem("crm_configuracoes", JSON.stringify({ nomeInstrutor: "Old Name" }))
    const result = getConfiguracoes()
    expect(result.nomeProprietario).toBe("Old Name")
  })
})

describe("clearAllData", () => {
  it("removes all data", () => {
    saveVendedor(makeVendedor())
    saveVenda(makeVenda())
    saveConfiguracoes({ nomeProprietario: "Test" })
    clearAllData()
    expect(getVendedores()).toEqual([])
    expect(getVendas()).toEqual([])
    expect(getConfiguracoes().nomeProprietario).toBe("Proprietário")
  })
})
