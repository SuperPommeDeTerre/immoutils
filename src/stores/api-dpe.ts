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
  building_year?: number | null
  building_type: DpeBuildingType | string | null
  habitable_surface?: number | null
  latitude?: number | null
  longitude?: number | null
}

function dateToAPIString (date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

function searchCriteriasToURLSearchParams (criterias: DpeApiSearchCriterias): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (criterias.city_name) {
    searchParams.append('nom_commune_brut_search', criterias.city_name)
  }
  if (criterias.from_date && !criterias.to_date) {
    searchParams.append('date_etablissement_dpe_eq', dateToAPIString(criterias.from_date))
  } else {
    if (criterias.from_date) {
      searchParams.append('date_etablissement_dpe_gte', dateToAPIString(criterias.from_date))
    }
    if (criterias.to_date) {
      searchParams.append('date_etablissement_dpe_lte', dateToAPIString(criterias.to_date))
    }
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

function getBuildingTypeFromString (buildingType: string): DpeBuildingType | string | null {
  switch (buildingType) {
    case 'maison': { return DpeBuildingType.HOUSE }
    case 'appartement': { return DpeBuildingType.APARTMENT }
    case 'immeuble': { return DpeBuildingType.BUILDING }
    default: { return buildingType }
  }
}
async function rawApiResultToDpeResult (raw_result: any): Promise<DpeResult> {
  const returned_result = {
    dpe_number: raw_result.numero_dpe,
    dpe_date: new Date(raw_result.date_etablissement_dpe),
    dpe_tag: raw_result.etiquette_dpe as DpeTag,
    street_number_ban: raw_result.numero_voie_ban,
    street_name_ban: raw_result.nom_rue_ban,
    city_name_ban: raw_result.nom_commune_ban,
    postal_code_ban: raw_result.code_postal_ban,
    insee_code_ban: raw_result.code_insee_ban,
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
  tag?: DpeTag[] | null
  surface?: number | null
  from_date?: Date | null
  to_date?: Date | null
  building_type?: string[] | null
}

export const useApiDpeStore = defineStore('api-dpe', {
  state: () => ({
    dpe_established: [] as DpeResult[],
  }),
  actions: {
    async fetchDpeData (criterias: DpeApiSearchCriterias) {
      const searchParams = searchCriteriasToURLSearchParams(criterias)
      await fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines?${searchParams.toString()}`)
        .then(data => data.json())
        .then(async data => {
          useApiDpeStore().dpe_established = await Promise.all(data.results.map((raw_result: any) => rawApiResultToDpeResult(raw_result)))
        })
    },
  },
})
