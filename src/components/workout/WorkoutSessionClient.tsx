'use client'
import { useRouter } from 'next/navigation'
import { ExerciseStepper } from './ExerciseStepper'

type StepperProps = Omit<
  React.ComponentProps<typeof ExerciseStepper>,
  'onRefresh' | 'onFinish' | 'onSkip' | 'onAdHoc'
>

export function WorkoutSessionClient(props: StepperProps & { sessionId: number }) {
  const router = useRouter()
  return (
    <ExerciseStepper
      {...props}
      onRefresh={() => router.refresh()}
      onSkip={() => router.refresh()}
      onAdHoc={() => router.refresh()}
      onFinish={() => router.push(`/workout/${props.sessionId}#summary`)}
    />
  )
}
