const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number): string {
  return `${value}%`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR")
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatCurrencyInput(value: string): string {
  const cleaned = value.replace(/[R$\s]/g, "")
  const commaIndex = cleaned.lastIndexOf(",")
  let intPart = commaIndex === -1 ? cleaned : cleaned.slice(0, commaIndex)
  let decPart = commaIndex === -1 ? "" : cleaned.slice(commaIndex + 1)
  const intDigits = intPart.replace(/\D/g, "")
  decPart = decPart.replace(/\D/g, "").slice(0, 2)
  if (!intDigits && !decPart) return ""
  const intNumber = intDigits ? parseInt(intDigits, 10) : 0
  const formattedInt = intNumber.toLocaleString("pt-BR")
  if (commaIndex === -1) return formattedInt
  return `${formattedInt},${decPart}`
}

export function formatCurrencyInputNumber(value: number): string {
  if (isNaN(value) || value < 0) return ""
  const intPart = String(Math.trunc(value))
  const decimals = Math.round((value - Math.trunc(value)) * 100)
  const formattedInt = formatCurrencyInput(intPart)
  if (decimals <= 0) return formattedInt
  const decString = String(decimals).padStart(2, "0")
  return `${formattedInt},${decString}`
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
