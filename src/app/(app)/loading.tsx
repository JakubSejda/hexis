import { Container, Skeleton, Stack } from '@/components/ui'

export default function AppLoading() {
  return (
    <Container>
      <Stack gap={4} className="py-4">
        <Skeleton shape="text" className="w-40" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </Stack>
    </Container>
  )
}
