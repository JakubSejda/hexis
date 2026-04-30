import { z } from 'zod'

const cadence = z.enum(['daily', 'weekly'])
const weight = z.enum(['light', 'standard', 'heavy'])

export const habitCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    cadence,
    weeklyTarget: z.number().int().min(1).max(7).optional(),
    weight: weight.default('standard'),
  })
  .superRefine((val, ctx) => {
    if (val.cadence === 'daily' && val.weeklyTarget !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'weeklyTarget must be omitted for daily cadence',
        path: ['weeklyTarget'],
      })
    }
    if (val.cadence === 'weekly' && val.weeklyTarget === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'weeklyTarget is required for weekly cadence',
        path: ['weeklyTarget'],
      })
    }
  })

export const habitPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    weight: weight.optional(),
    archivedAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must not be empty' })

export const habitCheckSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
})

export type HabitCreate = z.infer<typeof habitCreateSchema>
export type HabitPatch = z.infer<typeof habitPatchSchema>
export type HabitCheck = z.infer<typeof habitCheckSchema>
