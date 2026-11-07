import Image from 'next/image'
import { Card } from '@/components/ui'

const SHELL =
  'relative flex min-h-screen flex-col items-center justify-end overflow-hidden p-5 pb-10 md:justify-center'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className={SHELL}>
      <Image
        src="/images/hero-player.svg"
        alt=""
        fill
        priority
        unoptimized
        sizes="100vw"
        className="hero-art object-cover object-[center_15%] opacity-80 md:opacity-50"
      />
      <span aria-hidden className="hero-glow absolute inset-0" />
      <Card
        padding="lg"
        className="bg-surface/90 relative w-full max-w-sm shadow-lg backdrop-blur-md"
      >
        {children}
      </Card>
    </main>
  )
}
