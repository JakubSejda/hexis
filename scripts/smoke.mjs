// Post-deploy smoke test: logs in, walks every screen at 375 px and runs the core flows
// (log a set, finish a workout, log food, create a habit). It WRITES data, so point it
// at a test account only. Usage: BASE=https://host SMOKE_EMAIL=... SMOKE_PASSWORD=... node scripts/smoke.mjs
import { chromium } from '@playwright/test'

const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD
if (!EMAIL || !PASSWORD) throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD')

const BASE = process.env.BASE ?? 'http://localhost:3001'
const results = []
const ok = (name, pass, info = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`)

const b = await chromium.launch()
const ctx = await b.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
})
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
p.on(
  'console',
  (m) =>
    m.type() === 'error' && !/409|Failed to load resource/.test(m.text()) && errors.push(m.text())
)

try {
  await p.goto(BASE + '/login')
  await p.getByLabel('E-mail').fill(EMAIL)
  await p.getByLabel('Heslo').fill(PASSWORD)
  await p.getByRole('button', { name: /přihlásit/i }).click()
  await p.waitForURL(/dashboard/, { timeout: 60000 })
  ok('login', true)

  for (const r of [
    'dashboard',
    'training',
    'nutrition',
    'habits',
    'bio',
    'progress',
    'progress/photos',
    'stats',
    'stats/strength',
    'rewards',
    'calendar',
    'settings',
    'settings/profile',
    'settings/export',
  ]) {
    const res = await p.goto(`${BASE}/${r}`, { waitUntil: 'networkidle' })
    const w = await p.evaluate(() => document.documentElement.scrollWidth)
    ok(`screen /${r}`, res.status() === 200 && w <= 375, `HTTP ${res.status()}, width ${w}`)
  }

  // Workout: start (or resume) a session, log one set, finish it.
  await p.goto(BASE + '/training', { waitUntil: 'networkidle' })
  const resume = p.getByRole('link', { name: /quest probíhá/i })
  if (await resume.count()) await resume.click()
  else await p.getByRole('button', { name: /začít quest/i }).click()
  await p.waitForURL(/training\/\d+/, { timeout: 60000 })
  await p.waitForLoadState('networkidle')
  const setPost = p
    .waitForResponse(
      (r) => /\/api\/sessions\/\d+\/sets/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 20000 }
    )
    .catch(() => null)
  const kg = p.getByLabel('Váha kg')
  if ((await kg.inputValue()) === '') await kg.fill('40')
  await p.getByRole('button', { name: /zapsat sérii/i }).click()
  const resp = await setPost
  ok('log a set', resp?.status() === 201 || resp?.status() === 200, `POST sets → ${resp?.status()}`)
  await p.waitForTimeout(1500)
  await p
    .getByRole('button', { name: /^dokončit$/i })
    .first()
    .click()
    .catch(() => {})
  await p.waitForTimeout(800)
  const finish = p.getByRole('button', { name: /dokončit trénink/i })
  if (await finish.count()) {
    await finish.click()
    await p.waitForTimeout(3000)
  }
  ok(
    'finish workout',
    !/training\/\d+/.test(p.url()) || (await p.getByText(/splněn/i).count()) > 0,
    p.url()
  )

  // Nutrition: log today.
  await p.goto(BASE + '/nutrition', { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /zapsat dnešek|upravit dnešek/i }).click()
  await p.waitForTimeout(800)
  const kcal = p.getByLabel('Kalorie').first()
  if (await kcal.count()) {
    await kcal.fill('2100')
    await p.getByRole('button', { name: /uložit/i }).click()
    await p.waitForTimeout(2000)
    ok('log nutrition', (await p.getByText(/dnešek zapsán/i).count()) > 0)
  } else ok('log nutrition', false, 'kcal field not found')

  // Habits: create one and check it.
  await p.goto(BASE + '/habits', { waitUntil: 'networkidle' })
  const create = p.getByRole('button', { name: /založit první návyk|nový návyk/i }).first()
  await create.click()
  await p.waitForTimeout(500)
  await p
    .getByRole('dialog')
    .getByRole('textbox')
    .first()
    .fill('Smoke ' + Date.now())
  await p
    .getByRole('dialog')
    .getByRole('button', { name: /^vytvořit$/i })
    .click()
  await p.waitForTimeout(2000)
  ok('create habit', (await p.getByText(/^Smoke /).count()) > 0)

  ok('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '))
} catch (e) {
  ok('flow aborted', false, String(e).split('\n')[0])
}
console.log(results.join('\n'))
await b.close()
