export type DayClass = 'hit' | 'miss' | 'empty'
export type MacroClass = 'hit' | 'near' | 'miss' | 'none'

export function classifyDay(args: {
  kcalActual: number | null
  targetKcal: number | null
}): DayClass {
  if (args.kcalActual == null || args.targetKcal == null) return 'empty'
  return args.kcalActual <= args.targetKcal * 1.1 ? 'hit' : 'miss'
}

export function classifyMacro(args: { actual: number | null; target: number | null }): MacroClass {
  if (args.actual == null || args.target == null) return 'none'
  if (args.actual <= args.target) return 'hit'
  if (args.actual <= args.target * 1.1) return 'near'
  return 'miss'
}
