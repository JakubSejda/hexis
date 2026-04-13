import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Vítejte, {session!.user.name ?? session!.user.email}
      </h1>
      <p className="text-muted mt-2">
        Level {session!.user.level ?? 1} — M1 Auth hotovo, core workout flow přijde v M2.
      </p>
      <p className="text-muted mt-6 text-sm italic">
        &ldquo;ἕξις — vaše habity se stávají vaším stavem.&rdquo;
      </p>
    </div>
  )
}
