import { NextRequest } from 'next/server'
import { queryExercises } from '@/lib/exercise-loader'

export const runtime = 'nodejs'

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const page = parsePositiveInteger(params.get('page'))
  const pageSize = parsePositiveInteger(params.get('pageSize'))

  if ((params.has('page') && page === undefined) || (params.has('pageSize') && pageSize === undefined)) {
    return Response.json({ error: 'La página y su tamaño deben ser enteros positivos.' }, { status: 400 })
  }

  const result = queryExercises({
    query: params.get('q') || '',
    category: params.get('category') || 'todos',
    equipment: params.get('equipment') || 'todos',
    page,
    pageSize,
  })

  return Response.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
