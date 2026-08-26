import { useState, useCallback, useEffect } from "react"
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

  useEffect(() => {
    const handler = () => setVendedores(getVendedores())
    window.addEventListener("crm-data-synced", handler)
    return () => window.removeEventListener("crm-data-synced", handler)
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
