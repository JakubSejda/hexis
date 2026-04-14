'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ExerciseStepper } from './ExerciseStepper'

type StepperProps = Omit<
  React.ComponentProps<typeof ExerciseStepper>,
  'onRefresh' | 'onFinish' | 'onSkip' | 'onAdHoc' | 'skipped'
>

export function WorkoutSessionClient(
  props: StepperProps & { sessionId: number; skippedIds?: number[] }
) {
  const router = useRouter()
  const { skippedIds, ...rest } = props
  const skipped = useMemo(() => new Set(skippedIds ?? []), [skippedIds])
  return (
    <ExerciseStepper
      {...rest}
      skipped={skipped}
      onRefresh={() => router.refresh()}
      onSkip={() => router.refresh()}
      onAdHoc={() => router.refresh()}
      onFinish={() => router.push(`/workout/${props.sessionId}#summary`)}
    />
  )
}
