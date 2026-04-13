import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Email je povinný')
  .email('Neplatný email')
  .transform((s) => s.toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'Heslo musí mít alespoň 8 znaků')
  .regex(/[A-Z]/, 'Heslo musí obsahovat velké písmeno')
  .regex(/[0-9]/, 'Heslo musí obsahovat číslo')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Heslo je povinné'),
})

export type LoginInput = z.infer<typeof loginSchema>
