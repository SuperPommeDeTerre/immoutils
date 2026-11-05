// Store for the geocoding API from french gouvernment (see https://data.geopf.fr/geocodage/openapi)
import { defineStore } from 'pinia'

export interface ApiCadastreSearchCriterias {
  longitude: number
  latitude: number
  departmentCode: string
  municipalityCode: string
}

export const useApiGeocodageStore = defineStore('api-geocodage', {
  state: () => ({
    //
  }),
  actions: {
    async getCadastreParcelId (criterias: ApiCadastreSearchCriterias): Promise<string> {
      const cadastreRequestParams = new URLSearchParams({
        searchgeom: JSON.stringify({
          type: 'Circle',
          coordinates: [criterias.longitude, criterias.latitude],
          radius: 5,
        }),
        index: 'parcel',
        limit: '10',
        returntruegeometry: 'false',
        departmentcode: criterias.departmentCode,
        municipalitycode: criterias.municipalityCode,
      })
      const parcelId = await fetch(`https://data.geopf.fr/geocodage/reverse?${cadastreRequestParams.toString()}`)
        .then(data => data.json())
        .then(data => {
          if (data.features.length > 1) {
            return data.features[1]?.properties?.id
          }
          return data.features[0]?.properties?.id
        })
      return parcelId
    },
  },
})
