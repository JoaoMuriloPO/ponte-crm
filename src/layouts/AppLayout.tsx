import { useState } from "react"
import { Outlet, NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FileDown,
  BarChart3,
  Settings,
  Menu,
  X,
  TrendingUp,
  Cloud,
  CloudOff,
  RefreshCw,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { getConfiguracoes } from "@/services/storage/localStorageService"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/hooks/useTheme"

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vendedores", label: "Pontes", icon: Users },
  { to: "/vendas", label: "Baixar Relatório", icon: FileDown },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const config = getConfiguracoes()
  const { user, isAuthenticated, isSyncing, lastSync, syncToGist, loadFromGist } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-none text-sidebar-foreground">CRM Financeiro</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-0.5">{config.nomeProprietario}</p>
        </div>
      </div>

      {/* Auth & Sync status */}
      {isAuthenticated && user && (
        <>
          <Separator className="bg-sidebar-border" />
          <div className="px-6 py-3">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-6 w-6 rounded-full"
              />
              <span className="text-xs font-medium truncate text-sidebar-foreground">{user.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {lastSync ? (
                <span className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
                  <Cloud className="h-3 w-3" />
                  Sync: {new Date(lastSync).toLocaleTimeString("pt-BR")}
                </span>
              ) : (
                <span className="text-[10px] text-sidebar-foreground/60 flex items-center gap-1">
                  <CloudOff className="h-3 w-3" />
                  Sem sync
                </span>
              )}
            </div>
            <div className="flex gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={syncToGist}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Cloud className="h-3 w-3 mr-1" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={loadFromGist}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Carregar
              </Button>
            </div>
          </div>
        </>
      )}

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </Button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar" showCloseButton={false}>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="font-semibold text-sidebar-foreground">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold text-sm text-foreground">CRM Financeiro</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
