export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-lg border p-6 shadow-lg">
        {children}
      </div>
    </main>
  )
}
