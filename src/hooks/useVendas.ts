import { useState, useCallback } from "react"
import type { Venda } from "@/types"
import {
  getVendas,
  getVendasByVendedor,
  saveVenda,
  updateVenda,
  deleteVenda,
} from "@/services/storage/localStorageService"

export function useVendas() {
  const [vendas, setVendas] = useState<Venda[]>(() => getVendas())

  const refresh = useCallback(() => {
    setVendas(getVendas())
  }, [])

  const add = useCallback((venda: Venda) => {
    saveVenda(venda)
    setVendas(getVendas())
  }, [])

  const update = useCallback((venda: Venda) => {
    updateVenda(venda)
    setVendas(getVendas())
  }, [])

  const remove = useCallback((id: string) => {
    deleteVenda(id)
    setVendas(getVendas())
  }, [])

  const getByVendedor = useCallback((vendedorId: string) => {
    return getVendasByVendedor(vendedorId)
  }, [])

  return { vendas, refresh, add, update, remove, getByVendedor }
}
