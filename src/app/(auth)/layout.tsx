import { Card } from '@/components/ui'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card padding="lg" className="w-full max-w-sm shadow-lg">
        {children}
      </Card>
    </main>
  )
}
