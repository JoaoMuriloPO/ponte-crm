import { createBrowserRouter, Navigate } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Dashboard from "@/pages/Dashboard"
import Vendedores from "@/pages/Vendedores"
import VendedorDetalhe from "@/pages/VendedorDetalhe"
import Vendas from "@/pages/Vendas"
import Relatorios from "@/pages/Relatorios"
import Configuracoes from "@/pages/Configuracoes"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "vendedores", element: <Vendedores /> },
      { path: "vendedores/:id", element: <VendedorDetalhe /> },
      { path: "vendas", element: <Vendas /> },
      { path: "relatorios", element: <Relatorios /> },
      { path: "configuracoes", element: <Configuracoes /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
])
