// Store for the DPE API from ADEME (see https://data.ademe.fr/datasets/dpe03existant/api-doc)
import { defineStore } from 'pinia'
import proj4 from 'proj4'

/**
 * Allewed DPE tags
 */
export enum DpeTag {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  N = 'N',
}

export enum DpeBuildingType {
  HOUSE = 'maison',
  APARTMENT = 'appartement',
  BUILDING = 'immeuble',
}

/**
 * Result interface
 */
export interface DpeResult {
  dpe_number: string
  dpe_date: Date
  dpe_tag: DpeTag
  street_number_ban?: string | null
  street_name_ban?: string | null
  city_name_ban?: string | null
  postal_code_ban?: string | null
  insee_code_ban?: string | null
  full_address: string
  building_year?: number | null
  building_type: DpeBuildingType | string | null
  habitable_surface?: number | null
  latitude?: number | null
  longitude?: number | null
}

function dateToAPIString (date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

function getDiagnosticsDateRangeParams (from_date?: Date | null, to_date?: Date | null, prefix = 'date_etablissement_dpe', eq_suffix = 'eq', lte_suffix = 'lte', gte_suffix = 'gte'): Record<string, string> {
  const queryParams: Record<string, string> = {}
  if (from_date && !to_date) {
    queryParams[`${prefix}_${eq_suffix}`] = dateToAPIString(from_date)
  } else {
    if (from_date) {
      queryParams[`${prefix}_${gte_suffix}`] = dateToAPIString(from_date)
    }
    if (to_date) {
      queryParams[`${prefix}_${lte_suffix}`] = dateToAPIString(to_date)
    }
  }
  return queryParams
}

async function searchCriteriasToURLSearchParamsForAPIBefore2021_07_01 (criterias: DpeApiSearchCriterias): Promise<URLSearchParams> {
  const searchParams = new URLSearchParams()
  if (criterias.city_name) {
    searchParams.append('geo_adresse_search', criterias.city_name)
  }
  if (criterias.city_postal_codes && criterias.city_postal_codes.length > 0) {
    // Gets the INSEE codes from the postal codes
    const postalCodesPromises = []
    for (const postalCode of criterias.city_postal_codes) {
      postalCodesPromises.push(
        fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`)
          .then(response => response.json())
          .then(data => data.map((commune: any) => commune.code)),
      )
    }
    const inseeCodes = await Promise.all(postalCodesPromises)
    searchParams.append('code_insee_commune_actualise_in', inseeCodes.flat().join(','))
  }
  for (const [paramName, paramValue] of Object.entries(getDiagnosticsDateRangeParams(criterias.from_date, criterias.to_date))) {
    searchParams.append(paramName, paramValue)
  }
  if (criterias.tag && criterias.tag.length > 0) {
    searchParams.append('classe_consommation_energie_in', criterias.tag.join(','))
  }
  if (criterias.building_type && criterias.building_type.length > 0) {
    const buildingTypeCriteria = criterias.building_type.map(buildingType => getBuildingTypeStringForAPIBefore2021_07_01(getBuildingTypeFromString(buildingType)))
    searchParams.append('tr002_type_batiment_description_in', buildingTypeCriteria.join(','))
  }
  if (criterias.surface) {
    const lowerBound = criterias.surface - (criterias.surface * 0.1)
    const upperBound = criterias.surface + (criterias.surface * 0.1)
    searchParams.append('surface_thermique_lot_gte', lowerBound.toString())
    searchParams.append('surface_thermique_lot_lte', upperBound.toString())
  }
  searchParams.append('select', [
    'numero_dpe',
    'date_etablissement_dpe',
    'classe_consommation_energie',
    'annee_construction',
    'surface_thermique_lot',
    'latitude',
    'longitude',
    'tv016_departement_code',
    'tr002_type_batiment_description',
    'code_insee_commune_actualise',
    'geo_adresse'].join(','))
  searchParams.append('sort', 'date_etablissement_dpe')
  searchParams.append('size', '500')
  return searchParams
}

function searchCriteriasToURLSearchParamsForAPIAfter2021_07_01 (criterias: DpeApiSearchCriterias): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (criterias.city_name) {
    searchParams.append('nom_commune_brut_search', criterias.city_name)
  }
  if (criterias.city_postal_codes && criterias.city_postal_codes.length > 0) {
    searchParams.append('code_postal_brut_in', criterias.city_postal_codes.join(','))
  }
  for (const [paramName, paramValue] of Object.entries(getDiagnosticsDateRangeParams(criterias.from_date, criterias.to_date))) {
    searchParams.append(paramName, paramValue)
  }
  if (criterias.building_type && criterias.building_type.length > 0) {
    searchParams.append('type_batiment_in', criterias.building_type.join(','))
  }
  if (criterias.surface) {
    const lowerBound = criterias.surface - (criterias.surface * 0.1)
    const upperBound = criterias.surface + (criterias.surface * 0.1)
    searchParams.append('surface_habitable_logement_gte', lowerBound.toString())
    searchParams.append('surface_habitable_logement_lte', upperBound.toString())
  }
  if (criterias.tag && criterias.tag.length > 0) {
    searchParams.append('etiquette_dpe_in', criterias.tag.join(','))
  }
  searchParams.append('select', [
    'nom_commune_brut',
    'adresse_brut',
    'code_postal_brut',
    'adresse_complete_brut',
    'date_etablissement_dpe',
    'numero_dpe',
    'etiquette_dpe',
    'type_batiment',
    'annee_construction',
    'typologie_logement',
    'numero_voie_ban',
    'nom_rue_ban',
    'nom_commune_ban',
    'code_postal_ban',
    'code_insee_ban',
    'coordonnee_cartographique_x_ban',
    'coordonnee_cartographique_y_ban',
    'surface_habitable_logement'].join(','))
  searchParams.append('sort', 'date_etablissement_dpe')
  searchParams.append('size', '500')
  return searchParams
}

function getBuildingTypeStringForAPIBefore2021_07_01 (buildingType: DpeBuildingType | string): string | null {
  switch (buildingType) {
    case DpeBuildingType.HOUSE: { return 'Maison Individuelle' }
    case DpeBuildingType.APARTMENT: { return 'Logement' }
    case DpeBuildingType.BUILDING: { return 'Bâtiment collectif à usage principal d\'habitation' }
    default: { return null }
  }
}

function getBuildingTypeFromStringBefore2021_07_01 (buildingType: string): DpeBuildingType | string {
  switch (buildingType) {
    case 'Maison Individuelle': { return DpeBuildingType.HOUSE }
    case 'Logement': { return DpeBuildingType.APARTMENT }
    case 'Bâtiment collectif à usage principal d\'habitation': { return DpeBuildingType.BUILDING }
    default: { return buildingType }
  }
}

function getBuildingTypeFromString (buildingType: string): DpeBuildingType | string {
  switch (buildingType) {
    case 'maison': { return DpeBuildingType.HOUSE }
    case 'appartement': { return DpeBuildingType.APARTMENT }
    case 'immeuble': { return DpeBuildingType.BUILDING }
    default: { return buildingType }
  }
}

function computeFullAddress (dpe_result: DpeResult): string {
  let fullAddress = ''
  if (dpe_result.street_number_ban) {
    fullAddress = `${dpe_result.street_number_ban}`
  }
  if (dpe_result.street_name_ban) {
    fullAddress += `${fullAddress.length > 0 ? ' ' : ''}${dpe_result.street_name_ban}`
  }
  if (dpe_result.postal_code_ban || dpe_result.city_name_ban) {
    fullAddress += `${fullAddress.length > 0 ? ', ' : ''}${dpe_result.postal_code_ban ?? ''}`
    fullAddress += `${fullAddress.length > 0 ? ' ' : ''}${dpe_result.city_name_ban ?? ''}`
  }
  return fullAddress
}

async function rawApiResultToDpeResultBefore2021_07_01 (raw_result: any): Promise<DpeResult> {
  const returned_result: DpeResult = {
    dpe_number: raw_result.numero_dpe,
    dpe_date: new Date(raw_result.date_etablissement_dpe),
    dpe_tag: raw_result.classe_consommation_energie as DpeTag,
    latitude: raw_result.latitude,
    longitude: raw_result.longitude,
    habitable_surface: raw_result.surface_thermique_lot,
    building_year: raw_result.annee_construction,
    full_address: raw_result.geo_adresse,
    insee_code_ban: raw_result.code_insee_commune_actualise,
    building_type: getBuildingTypeFromStringBefore2021_07_01(raw_result.tr002_type_batiment_description),
  }
  const searchQueryParams = new URLSearchParams({ q: raw_result.geo_adresse })
  await fetch(`https://api-adresse.data.gouv.fr/search/?${searchQueryParams.toString()}`)
    .then(response => response.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        const firstResult = data.features[0].properties
        returned_result.street_name_ban = firstResult.street ?? ''
        returned_result.street_number_ban = firstResult.housenumber ?? ''
        returned_result.postal_code_ban = firstResult.postcode ?? ''
        returned_result.city_name_ban = firstResult.city ?? ''
      }
    })
  return returned_result
}

async function rawApiResultToDpeResult (raw_result: any): Promise<DpeResult> {
  const returned_result: DpeResult = {
    dpe_number: raw_result.numero_dpe,
    dpe_date: new Date(raw_result.date_etablissement_dpe),
    dpe_tag: raw_result.etiquette_dpe as DpeTag,
    street_number_ban: raw_result.numero_voie_ban,
    street_name_ban: raw_result.nom_rue_ban,
    city_name_ban: raw_result.nom_commune_ban,
    postal_code_ban: raw_result.code_postal_ban,
    insee_code_ban: raw_result.code_insee_ban,
    full_address: '',
    building_year: raw_result.annee_construction,
    building_type: getBuildingTypeFromString(raw_result.type_batiment),
    habitable_surface: raw_result.surface_habitable_logement,
    latitude: raw_result.coordonnee_cartographique_y_ban,
    longitude: raw_result.coordonnee_cartographique_x_ban,
  }
  // Try to complete the address using the raw address if available
  if (!returned_result.street_name_ban && raw_result.adresse_brut) {
    returned_result.street_name_ban = raw_result.adresse_brut
  }
  if (!returned_result.postal_code_ban && raw_result.code_postal_brut) {
    returned_result.postal_code_ban = raw_result.code_postal_brut
  }
  if (!returned_result.city_name_ban && raw_result.nom_commune_brut) {
    returned_result.city_name_ban = raw_result.nom_commune_brut
  }
  // Compute the full address
  returned_result.full_address = computeFullAddress(returned_result)
  // Convert X/Y (referentiel epsg 2154 lambert 93) to latitude/longitude (WGS84)
  if (!raw_result.coordonnee_cartographique_x_ban && !raw_result.coordonnee_cartographique_y_ban && raw_result.adresse_complete_brut) {
    // If no coordinates returned, then try to infer them from postal address
    const searchQueryParams = new URLSearchParams({ q: raw_result.adresse_complete_brut })
    await fetch(`https://api-adresse.data.gouv.fr/search/?${searchQueryParams.toString()}`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].geometry.coordinates
          returned_result.longitude = coords[0]
          returned_result.latitude = coords[1]
          returned_result.insee_code_ban = data.features[0].properties.citycode
        }
      })
  } else {
    const x = raw_result.coordonnee_cartographique_x_ban
    const y = raw_result.coordonnee_cartographique_y_ban
    if (!x || !y) {
      returned_result.longitude = 0
      returned_result.latitude = 0
    } else {
      const gpsCoordinates = proj4('+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs +type=crs', 'EPSG:4326').forward([x, y])
      returned_result.longitude = gpsCoordinates[0]
      returned_result.latitude = gpsCoordinates[1]
    }
  }
  return returned_result
}

/**
 * Search criterias for DPE
 */
export interface DpeApiSearchCriterias {
  city_name?: string | null
  city_postal_codes?: number[] | null
  tag?: DpeTag[] | null
  surface?: number | null
  from_date?: Date | null
  to_date?: Date | null
  building_type?: string[] | null
}

const dpeRepositoryChangeDate = new Date('2021-07-01')

export const useApiDpeStore = defineStore('api-dpe', {
  state: () => ({
    dpe_established: [] as DpeResult[],
  }),
  actions: {
    async fetchDpeData (criterias: DpeApiSearchCriterias) {
      const promisesToWait: Promise<any>[] = []
      // If start date or end date are before 2021-07-01, then, we need to fetch another API
      if (criterias.from_date && criterias.from_date < dpeRepositoryChangeDate) {
        console.log('Fetching data from API before 2021-07-01')
        const searchParams = await searchCriteriasToURLSearchParamsForAPIBefore2021_07_01(criterias)
        promisesToWait.push(fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/lines?${searchParams.toString()}`)
          .then(data => data.json())
          .then(async data => await Promise.all(data.results.map((raw_result: any) => rawApiResultToDpeResultBefore2021_07_01(raw_result)))))
      }
      if (criterias.to_date && criterias.to_date >= dpeRepositoryChangeDate) {
        console.log('Fetching data from API after 2021-07-01')
        const searchParams = searchCriteriasToURLSearchParamsForAPIAfter2021_07_01(criterias)
        // https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/lines
        promisesToWait.push(fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines?${searchParams.toString()}`)
          .then(data => data.json())
          .then(async data => await Promise.all(data.results.map((raw_result: any) => rawApiResultToDpeResult(raw_result)))))
      }
      const resultsFromAllAPI = await Promise.all(promisesToWait)
      const mergedResults = resultsFromAllAPI.flat()
      useApiDpeStore().dpe_established = mergedResults
    },
  },
})
