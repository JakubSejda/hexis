'use client'
import { Button, Card, Container, Heading, Stack } from '@/components/ui'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Container size="sm" className="py-8">
      <Card padding="lg">
        <Stack gap={3} className="items-start">
          <Heading level={1}>Něco se pokazilo</Heading>
          <p className="text-muted text-sm">
            Zkus to prosím znovu. Pokud problém přetrvá, zkus obnovit stránku.
          </p>
          {error.digest ? <p className="text-muted text-xs">Kód: {error.digest}</p> : null}
          <Button variant="primary" size="md" onClick={reset}>
            Zkusit znovu
          </Button>
        </Stack>
      </Card>
    </Container>
  )
}
