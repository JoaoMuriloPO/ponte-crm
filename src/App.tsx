import { RouterProvider } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/contexts/AuthContext"
import { router } from "@/routes"

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </TooltipProvider>
  )
}

export default App
