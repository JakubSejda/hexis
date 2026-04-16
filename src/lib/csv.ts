function escapeField(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function toCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T & string)[]
): string {
  const header = columns.join(',')
  if (data.length === 0) return header
  const rows = data.map((row) => columns.map((col) => escapeField(row[col])).join(','))
  return header + '\n' + rows.join('\n')
}
