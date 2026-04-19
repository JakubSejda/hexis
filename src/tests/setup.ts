import * as dotenv from 'dotenv'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

afterEach(() => {
  cleanup()
})
