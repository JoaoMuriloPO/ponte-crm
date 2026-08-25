import { useState, useCallback } from "react"
import type { Vendedor } from "@/types"
import {
  getVendedores,
  getVendedorById,
  saveVendedor,
  updateVendedor,
  deleteVendedor,
} from "@/services/storage/localStorageService"

export function useVendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>(() => getVendedores())

  const refresh = useCallback(() => {
    setVendedores(getVendedores())
  }, [])

  const add = useCallback((vendedor: Vendedor) => {
    saveVendedor(vendedor)
    setVendedores(getVendedores())
  }, [])

  const update = useCallback((vendedor: Vendedor) => {
    updateVendedor(vendedor)
    setVendedores(getVendedores())
  }, [])

  const remove = useCallback((id: string) => {
    deleteVendedor(id)
    setVendedores(getVendedores())
  }, [])

  const getById = useCallback((id: string) => {
    return getVendedorById(id)
  }, [])

  return { vendedores, refresh, add, update, remove, getById }
}
