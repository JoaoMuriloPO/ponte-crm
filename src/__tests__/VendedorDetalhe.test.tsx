import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { Vendedor, Venda } from "@/types"

const vendedor: Vendedor = {
  id: "v1",
  nome: "João",
  createdAt: "2025-01-01T00:00:00.000Z",
  despachanteEnabled: true,
  percentualVendedor: 20,
  percentualProprietario: 10,
}

const vendaExistente: Venda = {
  id: "s1",
  vendedorId: "v1",
  valor: 10000,
  data: "2025-06-15T00:00:00.000Z",
  descricao: "Mentoria",
  distribuicao: { empresa: 60, despachante: 10, vendedor: 20, proprietario: 10 },
}

const getById = vi.fn(() => vendedor)
const getByVendedor = vi.fn(() => [vendaExistente])
const addVenda = vi.fn()
const updateVenda = vi.fn()
const removeVenda = vi.fn()

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "v1" }),
  useNavigate: () => vi.fn(),
}))

vi.mock("@/hooks/useVendedores", () => ({
  useVendedores: () => ({ getById }),
}))

vi.mock("@/hooks/useVendas", () => ({
  useVendas: () => ({
    getByVendedor,
    add: addVenda,
    update: updateVenda,
    remove: removeVenda,
  }),
}))

vi.mock("@/services/storage/localStorageService", () => ({
  getConfiguracoes: () => ({ nomeProprietario: "Proprietário" }),
}))

import VendedorDetalhe from "@/pages/VendedorDetalhe"

describe("VendedorDetalhe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza as vendas do vendedor", () => {
    render(<VendedorDetalhe />)
    expect(screen.getByText("João - Ponte")).toBeInTheDocument()
    expect(screen.getByText("Mentoria")).toBeInTheDocument()
  })

  it("abre o diálogo de edição pré-preenchido ao clicar em editar", () => {
    render(<VendedorDetalhe />)
    fireEvent.click(screen.getByRole("button", { name: "Editar venda" }))
    expect(
      screen.getByRole("heading", { name: "Editar venda" })
    ).toBeInTheDocument()
    const valorInput = screen.getByLabelText("Valor da venda") as HTMLInputElement
    expect(valorInput.value).toBe("10000")
    expect(
      screen.getByRole("button", { name: "Salvar alterações" })
    ).toBeInTheDocument()
  })

  it("salva alterações com updateVenda", () => {
    render(<VendedorDetalhe />)
    fireEvent.click(screen.getByRole("button", { name: "Editar venda" }))

    const valorInput = screen.getByLabelText("Valor da venda") as HTMLInputElement
    fireEvent.change(valorInput, { target: { value: "12000" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }))
    expect(updateVenda).toHaveBeenCalledTimes(1)
    const updated = updateVenda.mock.calls[0][0] as Venda
    expect(updated.id).toBe("s1")
    expect(updated.valor).toBe(12000)
    expect(addVenda).not.toHaveBeenCalled()
  })

  it("habilita distribuição personalizada quando informa valores que totalizam 100%", () => {
    render(<VendedorDetalhe />)
    fireEvent.click(screen.getByRole("button", { name: "Nova venda" }))

    // Valor da venda
    fireEvent.change(screen.getByLabelText("Valor da venda"), {
      target: { value: "10000" },
    })

    fireEvent.click(
      screen.getByRole("switch", { name: "Distribuição personalizada" })
    )

    const ponteInput = screen.getByLabelText("João — Ponte")
    const propInput = screen.getByLabelText("Proprietário")
    fireEvent.change(ponteInput, { target: { value: "1500" } })
    fireEvent.change(propInput, { target: { value: "1500" } })

    const saveButton = screen.getByRole("button", { name: "Registrar venda" })
    expect(saveButton).toBeEnabled()

    fireEvent.click(saveButton)
    expect(addVenda).toHaveBeenCalledTimes(1)
    const nova = addVenda.mock.calls[0][0] as Venda
    expect(nova.distribuicaoCustomizada).toBe(true)
    expect(nova.distribuicao.vendedor).toBe(15)
    expect(nova.distribuicao.proprietario).toBe(15)
  })

  it("mostra erro somente ao tentar salvar com distribuição que não totaliza 100%", () => {
    render(<VendedorDetalhe />)
    fireEvent.click(screen.getByRole("button", { name: "Nova venda" }))

    fireEvent.change(screen.getByLabelText("Valor da venda"), {
      target: { value: "10000" },
    })

    fireEvent.click(
      screen.getByRole("switch", { name: "Distribuição personalizada" })
    )

    const ponteInput = screen.getByLabelText("João — Ponte")
    const propInput = screen.getByLabelText("Proprietário")
    fireEvent.change(ponteInput, { target: { value: "1400" } })
    fireEvent.change(propInput, { target: { value: "1500" } })

    // Enquanto digita, o erro ainda não aparece
    expect(
      screen.queryByText("Os percentuais precisam totalizar 100%.")
    ).not.toBeInTheDocument()

    const saveButton = screen.getByRole("button", { name: "Registrar venda" })
    expect(saveButton).toBeEnabled()

    // Ao clicar em salvar com distribuição inválida, o erro aparece
    fireEvent.click(saveButton)
    expect(
      screen.getByText("Os percentuais precisam totalizar 100%.")
    ).toBeInTheDocument()
    expect(addVenda).not.toHaveBeenCalled()

    // Ao corrigir os valores, o erro some
    fireEvent.change(ponteInput, { target: { value: "1500" } })
    expect(
      screen.queryByText("Os percentuais precisam totalizar 100%.")
    ).not.toBeInTheDocument()
  })
})