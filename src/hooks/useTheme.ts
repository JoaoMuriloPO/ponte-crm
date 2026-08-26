import { useState, useEffect, useCallback } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "crm_theme"

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved
  return "dark"
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  return { theme, toggleTheme }
}
