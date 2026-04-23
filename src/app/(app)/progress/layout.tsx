import { ProgressSegmentControl } from '@/components/ui'

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-xl font-semibold">Progres</h1>
      <ProgressSegmentControl />
      {children}
    </div>
  )
}
