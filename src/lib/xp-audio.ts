function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return Ctor ? new Ctor() : null
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, gainPeak = 0.2) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration)
}

export function playLevelUpDing(): void {
  const ctx = ac()
  if (!ctx) return
  tone(ctx, 880, 0, 0.3)
  setTimeout(() => ctx.close(), 400)
}

export function playTierUpFanfare(): void {
  const ctx = ac()
  if (!ctx) return
  tone(ctx, 523.25, 0, 0.2)
  tone(ctx, 659.25, 0.15, 0.2)
  tone(ctx, 783.99, 0.3, 0.4, 0.25)
  setTimeout(() => ctx.close(), 900)
}
