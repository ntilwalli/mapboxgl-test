export interface LngLatInterface {
  lng: number
  lat: number
}

export interface CuandoQueryInterface {
  begins: Date | any | null
  ends: Date | any | null
}

export interface DondeQueryInterface {
  center: LngLatInterface
  radius: number | null
}

export interface MetaQueryInterface {
  categories: string[] | null,
  event_types: string[] | null
}

export interface ListingQueryRequest {
  types: string[] | null | undefined
  releases: string[] | null | undefined
  parent_id: number | null | undefined
  cuando: CuandoQueryInterface | null | undefined
  donde: DondeQueryInterface | null | undefined
  meta: MetaQueryInterface | null | undefined
}