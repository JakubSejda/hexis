import { z } from 'zod'

export const rewardCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  costXp: z.number().int().min(1).max(999_999),
  description: z.string().max(280).optional(),
})

export const rewardPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    costXp: z.number().int().min(1).max(999_999).optional(),
    description: z.string().max(280).nullable().optional(),
    archivedAt: z.union([z.string().datetime(), z.null()]).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'patch must not be empty' })

export const redeemSchema = z.object({
  note: z.string().max(280).optional(),
})

export type RewardCreate = z.infer<typeof rewardCreateSchema>
export type RewardPatch = z.infer<typeof rewardPatchSchema>
export type RedeemInput = z.infer<typeof redeemSchema>
