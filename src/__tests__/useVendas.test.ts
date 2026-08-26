import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useVendas } from "@/hooks/useVendas"
import type { Venda } from "@/types"

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

beforeEach(() => {
  localStorage.clear()
})

describe("useVendas", () => {
  it("starts with empty array", () => {
    const { result } = renderHook(() => useVendas())
    expect(result.current.vendas).toEqual([])
  })

  it("loads initial data from localStorage", () => {
    localStorage.setItem("crm_vendas", JSON.stringify([makeVenda()]))
    const { result } = renderHook(() => useVendas())
    expect(result.current.vendas).toHaveLength(1)
  })

  it("adds a venda", () => {
    const { result } = renderHook(() => useVendas())
    act(() => {
      result.current.add(makeVenda())
    })
    expect(result.current.vendas).toHaveLength(1)
  })

  it("updates a venda", () => {
    localStorage.setItem("crm_vendas", JSON.stringify([makeVenda()]))
    const { result } = renderHook(() => useVendas())
    act(() => {
      result.current.update(makeVenda({ valor: 2000 }))
    })
    expect(result.current.vendas[0].valor).toBe(2000)
  })

  it("removes a venda", () => {
    localStorage.setItem("crm_vendas", JSON.stringify([makeVenda()]))
    const { result } = renderHook(() => useVendas())
    act(() => {
      result.current.remove("sale1")
    })
    expect(result.current.vendas).toHaveLength(0)
  })

  it("filters vendas by vendedor", () => {
    localStorage.setItem("crm_vendas", JSON.stringify([
      makeVenda({ id: "s1", vendedorId: "v1" }),
      makeVenda({ id: "s2", vendedorId: "v2" }),
    ]))
    const { result } = renderHook(() => useVendas())
    expect(result.current.getByVendedor("v1")).toHaveLength(1)
    expect(result.current.getByVendedor("v2")).toHaveLength(1)
  })

  it("re-renders when crm-data-synced event is dispatched", () => {
    const { result } = renderHook(() => useVendas())
    expect(result.current.vendas).toHaveLength(0)

    act(() => {
      localStorage.setItem("crm_vendas", JSON.stringify([
        makeVenda({ id: "synced-1", valor: 5000 }),
      ]))
      window.dispatchEvent(new Event("crm-data-synced"))
    })

    expect(result.current.vendas).toHaveLength(1)
    expect(result.current.vendas[0].valor).toBe(5000)
  })

  it("replaces all data on crm-data-synced (not appends)", () => {
    localStorage.setItem("crm_vendas", JSON.stringify([makeVenda({ id: "old" })]))
    const { result } = renderHook(() => useVendas())
    expect(result.current.vendas).toHaveLength(1)

    act(() => {
      localStorage.setItem("crm_vendas", JSON.stringify([
        makeVenda({ id: "new-1", valor: 100 }),
        makeVenda({ id: "new-2", valor: 200 }),
        makeVenda({ id: "new-3", valor: 300 }),
      ]))
      window.dispatchEvent(new Event("crm-data-synced"))
    })

    expect(result.current.vendas).toHaveLength(3)
  })

  it("cleans up event listener on unmount", () => {
    const spy = vi.spyOn(window, "removeEventListener")
    const { unmount } = renderHook(() => useVendas())
    unmount()
    expect(spy).toHaveBeenCalledWith("crm-data-synced", expect.any(Function))
    spy.mockRestore()
  })
})
