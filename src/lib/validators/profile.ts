import { z } from 'zod'

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((s) => {
    const y = Number(s.slice(0, 4))
    return y >= 1900 && y <= 9999
  }, 'year out of range')

export const profileUpdateSchema = z
  .object({
    name: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
    birthDate: z.union([ymd, z.null()]).optional(),
    gender: z.union([z.enum(['male', 'female', 'other']), z.null()]).optional(),
    heightCm: z.union([z.number().int().min(50).max(250), z.null()]).optional(),
    goalKg: z.union([z.number().min(30).max(300), z.null()]).optional(),
    goalText: z.union([z.string().max(120), z.null()]).optional(),
    startedAt: z.union([ymd, z.null()]).optional(),
  })
  .strict()

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
