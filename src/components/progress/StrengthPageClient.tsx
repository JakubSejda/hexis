'use client'

import { useState, useEffect, useCallback } from 'react'
import { TimeRangePicker } from './TimeRangePicker'
import { ExercisePicker } from './ExercisePicker'
import { OneRmChart } from './OneRmChart'
import { VolumeChart } from './VolumeChart'
import { StagnationList } from './StagnationList'
import type { StagnationResult } from '@/lib/stagnation'

type TrainedExercise = { id: number; name: string }
type StrengthPoint = { date: string; best1rm: number }
type WeeklyVolume = {
  weekStart: string
  chest: number
  back: number
  shoulders: number
  arms: number
  legs: number
}

export function StrengthPageClient() {
  const [days, setDays] = useState(90)
  const [exercises, setExercises] = useState<TrainedExercise[]>([])
  const [selectedExId, setSelectedExId] = useState<number | null>(null)
  const [strengthData, setStrengthData] = useState<StrengthPoint[]>([])
  const [volumeData, setVolumeData] = useState<WeeklyVolume[]>([])
  const [stagnation, setStagnation] = useState<StagnationResult[]>([])
  const [loading, setLoading] = useState(true)

  // Load exercise list once
  useEffect(() => {
    fetch('/api/exercises?trained=true')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.exercises ?? []) as TrainedExercise[]
        setExercises(list)
        if (list.length > 0 && !selectedExId) setSelectedExId(list[0]!.id)
      })
  }, [])

  // Load stagnation once
  useEffect(() => {
    fetch('/api/progress/stagnation')
      .then((r) => r.json())
      .then((data) => setStagnation(data.exercises ?? []))
  }, [])

  // Load charts when exercise or range changes
  const loadCharts = useCallback(async () => {
    setLoading(true)
    const [strengthRes, volumeRes] = await Promise.all([
      selectedExId
        ? fetch(`/api/progress/strength?exerciseId=${selectedExId}&days=${days}`).then((r) =>
            r.json()
          )
        : Promise.resolve({ dataPoints: [] }),
      fetch(`/api/progress/volume?days=${days}`).then((r) => r.json()),
    ])
    setStrengthData(strengthRes.dataPoints ?? [])
    setVolumeData(volumeRes.weeks ?? [])
    setLoading(false)
  }, [selectedExId, days])

  useEffect(() => {
    loadCharts()
  }, [loadCharts])

  return (
    <div className="flex flex-col gap-4">
      <TimeRangePicker value={days} onChange={setDays} />
      <StagnationList items={stagnation} />

      <section>
        <h2 className="mb-2 text-base font-semibold text-[#e5e7eb]">Estimated 1RM</h2>
        <ExercisePicker exercises={exercises} value={selectedExId} onChange={setSelectedExId} />
        <div className="mt-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
          ) : (
            <OneRmChart data={strengthData} />
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-[#e5e7eb]">Objem per svalovou skupinu</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-[#6b7280]">Načítám...</p>
        ) : (
          <VolumeChart data={volumeData} />
        )}
      </section>
    </div>
  )
}
