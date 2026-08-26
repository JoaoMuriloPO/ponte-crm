import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useVendedores } from "@/hooks/useVendedores"
import type { Vendedor } from "@/types"

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

beforeEach(() => {
  localStorage.clear()
})

describe("useVendedores", () => {
  it("starts with empty array", () => {
    const { result } = renderHook(() => useVendedores())
    expect(result.current.vendedores).toEqual([])
  })

  it("loads initial data from localStorage", () => {
    localStorage.setItem("crm_vendedores", JSON.stringify([makeVendedor(), makeVendedor({ id: "v2", nome: "Maria" })]))
    const { result } = renderHook(() => useVendedores())
    expect(result.current.vendedores).toHaveLength(2)
  })

  it("adds a vendedor", () => {
    const { result } = renderHook(() => useVendedores())
    act(() => {
      result.current.add(makeVendedor())
    })
    expect(result.current.vendedores).toHaveLength(1)
  })

  it("updates a vendedor", () => {
    localStorage.setItem("crm_vendedores", JSON.stringify([makeVendedor()]))
    const { result } = renderHook(() => useVendedores())
    act(() => {
      result.current.update(makeVendedor({ nome: "Updated" }))
    })
    expect(result.current.vendedores[0].nome).toBe("Updated")
  })

  it("removes a vendedor", () => {
    localStorage.setItem("crm_vendedores", JSON.stringify([makeVendedor()]))
    const { result } = renderHook(() => useVendedores())
    act(() => {
      result.current.remove("v1")
    })
    expect(result.current.vendedores).toHaveLength(0)
  })

  it("refreshes from localStorage", () => {
    const { result } = renderHook(() => useVendedores())
    expect(result.current.vendedores).toHaveLength(0)
    localStorage.setItem("crm_vendedores", JSON.stringify([makeVendedor()]))
    act(() => {
      result.current.refresh()
    })
    expect(result.current.vendedores).toHaveLength(1)
  })

  it("re-renders when crm-data-synced event is dispatched", () => {
    const { result } = renderHook(() => useVendedores())
    expect(result.current.vendedores).toHaveLength(0)

    // Simulate gist data being loaded into localStorage
    act(() => {
      localStorage.setItem("crm_vendedores", JSON.stringify([
        makeVendedor({ id: "synced-1", nome: "Synced Seller" }),
      ]))
      window.dispatchEvent(new Event("crm-data-synced"))
    })

    expect(result.current.vendedores).toHaveLength(1)
    expect(result.current.vendedores[0].nome).toBe("Synced Seller")
  })

  it("replaces all data on crm-data-synced (not appends)", () => {
    localStorage.setItem("crm_vendedores", JSON.stringify([makeVendedor({ id: "old" })]))
    const { result } = renderHook(() => useVendedores())
    expect(result.current.vendedores).toHaveLength(1)

    act(() => {
      localStorage.setItem("crm_vendedores", JSON.stringify([
        makeVendedor({ id: "new-1", nome: "New 1" }),
        makeVendedor({ id: "new-2", nome: "New 2" }),
      ]))
      window.dispatchEvent(new Event("crm-data-synced"))
    })

    expect(result.current.vendedores).toHaveLength(2)
    expect(result.current.vendedores.map(v => v.id)).toEqual(["new-1", "new-2"])
  })

  it("cleans up event listener on unmount", () => {
    const spy = vi.spyOn(window, "removeEventListener")
    const { unmount } = renderHook(() => useVendedores())
    unmount()
    expect(spy).toHaveBeenCalledWith("crm-data-synced", expect.any(Function))
    spy.mockRestore()
  })
})
