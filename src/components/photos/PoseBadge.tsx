const POSE_LABELS: Record<string, string> = {
  front: 'F',
  side: 'S',
  back: 'B',
  other: 'O',
}

type Props = {
  pose: string
}

export function PoseBadge({ pose }: Props) {
  return (
    <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {POSE_LABELS[pose] ?? pose[0]?.toUpperCase()}
    </span>
  )
}
