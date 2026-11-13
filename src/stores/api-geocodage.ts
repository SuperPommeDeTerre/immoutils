// Store for the geocoding API from french gouvernment (see https://data.geopf.fr/geocodage/openapi)
import { defineStore } from 'pinia'

export interface ApiCadastreSearchCriterias {
  longitude: number
  latitude: number
  cityInseeCode: string | null
}

export interface ApiCadastreParcelInfo {
  code_insee: string
  code_arr: string
  section: string
  numero: string
  parcelId: string
  surface: number | null
}

export const useApiGeocodageStore = defineStore('api-geocodage', {
  state: () => ({
    //
  }),
  actions: {
    /**
     * Find parcelID of the cadastre from criterias
     */
    async getCadastreParcelId (criterias: ApiCadastreSearchCriterias): Promise<string> {
      const cadastreRequestParams = new URLSearchParams({
        searchgeom: JSON.stringify({
          type: 'Circle',
          coordinates: [criterias.longitude, criterias.latitude],
          // Extend the circle to 5 meters as some streets are parcel and the DPE results
          // sadly gives geocoordinates of points in front of buildings instead of center
          radius: 5,
        }),
        index: 'parcel',
        limit: '2',
        returntruegeometry: 'false',
        departmentcode: criterias.cityInseeCode?.slice(0, 2) ?? '',
        municipalitycode: criterias.cityInseeCode?.slice(2) ?? '',
      })
      const parcelId = await fetch(`https://data.geopf.fr/geocodage/reverse?${cadastreRequestParams.toString()}`)
        .then(data => data.json())
        .then(data => {
          // If more than on feture, then assume that the second closest feature is the searched parcel
          // As said earlier, the streets can pe parcels.
          if (data.features.length > 1) {
            return data.features[1]?.properties?.id
          }
          return data.features[0]?.properties?.id
        })
      return parcelId
    },
    async getInformationFromParcelId (parcelId: string): Promise<ApiCadastreParcelInfo> {
      const cadastreRequestParams = new URLSearchParams({
        code_insee: parcelId.slice(0, 5), // Assuming the first 5 characters of parcelId represent the INSEE code
        code_arr: parcelId.slice(5, 8), // Assuming the next 3 characters represent the arrondissement code
        section: parcelId.slice(8, 10), // Assuming the next 2 characters represent the section
        numero: parcelId.slice(10), // Assuming the remaining characters represent the parcel number
      })
      const parcelInfo = await fetch(`https://apicarto.ign.fr/api/cadastre/parcelle?${cadastreRequestParams.toString()}`)
        .then(data => data.json())
        .then(data => {
          const properties = data.features[0]?.properties || {}
          const parcelInfoResult: ApiCadastreParcelInfo = {
            code_insee: properties.code_insee || '',
            code_arr: properties.code_arr || '',
            section: properties.section || '',
            numero: properties.numero || '',
            surface: properties.contenance || null,
            parcelId: parcelId || '',
          }
          return parcelInfoResult
        })
      return parcelInfo
    },
  },
})
