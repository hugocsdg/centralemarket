import { CONDITIONS } from './listings'
import type { Condition, Sort } from './listings'

// Los filtros de Explore tal como viven en la URL (?min=5&max=50&cond=New,Good&loc=Campus…).
export type Filters = {
  sort: Sort
  min: string
  max: string
  conditions: Condition[]
  location: string
  free: boolean
  available: boolean
  movingOut: boolean
  priceDrop: boolean
}

export function readFilters(params: URLSearchParams): Filters {
  return {
    sort: (params.get('sort') as Sort) ?? 'newest',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    conditions: (params.get('cond')?.split(',') ?? []).filter((c): c is Condition =>
      CONDITIONS.includes(c as Condition),
    ),
    location: params.get('loc') ?? '',
    free: params.has('free'),
    available: params.has('avail'),
    movingOut: params.has('moving'),
    priceDrop: params.has('drop'),
  }
}

// Cuántos filtros hay puestos (el orden no cuenta), para el numerito del botón.
export function countFilters(filters: Filters) {
  return [
    filters.min || filters.max,
    filters.conditions.length,
    filters.location,
    filters.free,
    filters.available,
    filters.movingOut,
    filters.priceDrop,
  ].filter(Boolean).length
}
