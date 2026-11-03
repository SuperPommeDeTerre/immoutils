<template>
  <v-container fluid>
    <h1>Rechercher par DPE</h1>

    <v-form validate-on="submit lazy" @submit="search" @submit.prevent="validateCriterias">
      <v-container fluid>
        <v-row>
          <v-col cols="6">
            <v-text-field v-model="selectedCommune" label="Commune" />
          </v-col>

          <v-col cols="6">
            <v-select
              v-model="selectedBuildingTypes"
              chips
              clearable
              :items="['maison','appartement','immeuble']"
              label="Type de bien"
              multiple
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-locale-provider locale="fr">
              <v-date-input
                v-model="selectedDateDPE"
                first-day-of-week="1"
                input-format="dd/mm/yyyy"
                label="Date d'établissement du DPE"
                :max="new Date().toISOString().split('T')[0]"
                min="2021-01-01"
                multiple="range"
                prepend-icon=""
                prepend-inner-icon="$calendar"
              />
            </v-locale-provider>
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="selectedNoteDPE"
              chips
              clearable
              item-title="label"
              item-value="value"
              :items="dpeNotes"
              label="Etiquette DPE"
              multiple
            >
              <template #item="{ props: dpeNoteProps, item }">
                <v-list-item v-bind="dpeNoteProps" :base-color="item.color" color="secondary" />
              </template>
            </v-select>
          </v-col>

          <v-col cols="4">
            <v-number-input
              v-model="buildingSurface"
              clearable
              control-variant="hidden"
              hint="Surface en m² (une recherche à +/- 10% sera effectuée)"
              label="Surface habitable"
              prepend-inner-icon="mdi-ruler-square"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-btn block class="mt-2" prepend-icon="mdi-magnify" type="submit">Rechercher</v-btn>
    </v-form>
  </v-container>

  <v-container fluid>
    <v-skeleton-loader
      v-if="loading"
      type="table"
      :types="{
        'table-thead': 'heading@3',
        'table-row': 'table-cell@3',
        'table-tbody': 'table-row-divider@4',
      }"
    />

    <v-table
      v-else-if="firstResearchDone"
      density="compact"
      fixed-header
    >
      <thead>
        <tr>
          <th scope="col">N° DPE</th>
          <th scope="col">Date d'établissement</th>
          <th scope="col">Etiquette DPE</th>
          <th scope="col">Surface habitable</th>
          <th scope="col">Type de bâtiment</th>
          <th scope="col">Année de construction</th>
          <th scope="col">Adresse</th>
          <th class="text-center" scope="col">Liens</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="result in results" :key="result.numero_dpe">
          <td><a :href="`https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${result.numero_dpe}`" target="_blank" title="Voir le DPE">{{ result.numero_dpe }}</a></td>
          <td>{{ new Date(result.date_etablissement_dpe).toLocaleDateString() }}</td>

          <td>
            <template v-for="dpeNote in dpeNotes">
              <v-chip
                v-if="result.etiquette_dpe==dpeNote.value"
                :key="dpeNote.value"
                :color="dpeNote.color"
                label
                variant="flat"
              >{{ dpeNote.value }}</v-chip>
            </template>
          </td>

          <td>{{ result.surface_habitable_logement }}</td>
          <td>{{ capitalize(result.type_batiment) }}</td>
          <td>{{ result.annee_construction }}</td>
          <td><a :href="getGoogleMapsLink(result)" target="_blank" title="Voir sur Google Maps">{{ result.numero_voie_ban??'' }} {{ result.nom_rue_ban }}, {{ result.code_postal_ban }} {{ result.nom_commune_ban }}</a></td>

          <td class="text-center">
            <v-btn density="compact" icon="mdi-map" title="Voir le cadastre" @click="openCadastre(result)" />
            <v-btn density="compact" icon="mdi-alert" title="Voir les géorisques" @click="openGeorisques(result)" />
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script lang="ts" setup>
  import proj4 from 'proj4'
  import { capitalize, ref, shallowRef } from 'vue'

  type DPEResult = {
    numero_dpe: string
    numero_voie_ban: string
    nom_rue_ban: string
    nom_commune_ban: string
    code_postal_ban: string
    code_insee_ban: string
    annee_construction: number
    coordonnee_cartographique_x_ban: number
    coordonnee_cartographique_y_ban: number
    longitude: number
    latitude: number
    type_batiment: string
    date_etablissement_dpe: string
    surface_habitable_logement: number
    etiquette_dpe: string
    _score: number
  }
  const loading = ref(false)

  const selectedNoteDPE = ref([])
  const selectedCommune = ref('')
  const selectedDateDPE = shallowRef(null)
  const selectedBuildingTypes = ref([])
  const buildingSurface = ref<number | null>(null)
  const firstResearchDone = ref(false)

  const dpeNotes = [
    {
      label: 'A',
      value: 'A',
      color: 'green-darken-4',
    },
    {
      label: 'B',
      value: 'B',
      color: 'green-darken-1',
    },
    {
      label: 'C',
      value: 'C',
      color: 'light-green-darken-1',
    },
    {
      label: 'D',
      value: 'D',
      color: 'yellow-accent-3',
    },
    {
      label: 'E',
      value: 'E',
      color: 'orange-accent-3',
    },
    {
      label: 'F',
      value: 'F',
      color: 'deep-orange-darken-3',
    },
    {
      label: 'G',
      value: 'G',
      color: 'red-darken-4',
    },
  ]
  const results = ref<DPEResult[]>([])

  function getGoogleMapsLink (result: DPEResult) {
    return `https://www.google.com/maps/search/?api=1&query=${result.numero_voie_ban ?? ''}+${result.nom_rue_ban}+${result.code_postal_ban}+${result.nom_commune_ban}`
  }

  function openGeorisques (result: DPEResult) {
    let georisquesLink = 'https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi/rapport2?form-adresse=true&isCadastre=false'
    georisquesLink += `&city=${result.nom_commune_ban}&type=adresse&typeForm=adresse`
    georisquesLink += `&codeInsee=${result.code_insee_ban}`
    if (result.longitude != 0 && result.latitude != 0) {
      georisquesLink += `&lon=${result.longitude}&lat=${result.latitude}&longitude=${result.longitude}&latitude=${result.latitude}`
    }
    georisquesLink += `&commune=${result.nom_commune_ban}&adresse=${result.numero_voie_ban ?? ''}+${result.nom_rue_ban}%2C+${result.code_postal_ban}+${result.nom_commune_ban}`
    window.open(georisquesLink, '_blank')
    return false
  }

  async function openCadastre (result: DPEResult) {
    window.open(await getCadastreLink(result), '_blank')
    return false
  }

  async function getCadastreLink (result: DPEResult) {
    // Get closest parcel number from coordinates
    const departmentCode = result.code_insee_ban.slice(0, 2)
    const municipalityCode = result.code_insee_ban.slice(2)

    const parcelId = await fetch(`https://data.geopf.fr/geocodage/reverse?searchgeom=%7B%22type%22%3A%22Circle%22%2C%22coordinates%22%3A%5B${result.longitude}%2C${result.latitude}%5D%2C%22radius%22%3A1%7D&index=parcel&limit=10&returntruegeometry=false&departmentcode=${departmentCode}&municipalitycode=${municipalityCode}`)
      .then(data => data.json())
      .then(data => data.features[0]?.properties?.id)
    let cadastreLink = `https://cadastre.data.gouv.fr/map?style=ortho&parcelleId=${parcelId}#18/`
    if (result.longitude != 0 && result.latitude != 0) {
      cadastreLink += `${result.latitude}/${result.longitude}`
    }
    return cadastreLink
  }

  function validateCriterias (e: Event) {
    e.preventDefault()
  }

  async function search () {
    loading.value = true
    results.value = []
    const searchParams = new URLSearchParams()
    // if (selectedCommune.value) searchParams.append('q', selectedCommune.value)
    if (selectedCommune.value) searchParams.append('nom_commune_brut_search', selectedCommune.value)
    // Only one date selected
    if (selectedDateDPE.value && selectedDateDPE.value[0] && !selectedDateDPE.value[1]) {
      const dpeDate = new Date(selectedDateDPE.value[0])
      const dpeDateFormatted = `${dpeDate.getFullYear()}-${(dpeDate.getMonth() + 1).toString().padStart(2, '0')}-${dpeDate.getDate().toString().padStart(2, '0')}`
      searchParams.append('date_etablissement_dpe_eq', dpeDateFormatted)
    } else {
      if (selectedDateDPE.value && selectedDateDPE.value[0]) {
        const startDate = new Date(selectedDateDPE.value[0])
        const startDateFormatted = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`
        searchParams.append('date_etablissement_dpe_gte', startDateFormatted)
      }
      if (selectedDateDPE.value && selectedDateDPE.value[1]) {
        const endDate = new Date(selectedDateDPE.value[1])
        const endDateFormatted = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`
        searchParams.append('date_etablissement_dpe_lte', endDateFormatted)
      }
    }
    if (selectedBuildingTypes.value && selectedBuildingTypes.value.length > 0) searchParams.append('type_batiment_in', selectedBuildingTypes.value.join(','))
    if (buildingSurface.value) {
      const lowerBound = buildingSurface.value - (buildingSurface.value * 0.1)
      const upperBound = buildingSurface.value + (buildingSurface.value * 0.1)
      searchParams.append('surface_habitable_logement_gte', lowerBound.toString())
      searchParams.append('surface_habitable_logement_lte', upperBound.toString())
    }
    if (selectedNoteDPE.value && selectedNoteDPE.value.length > 0) searchParams.append('etiquette_dpe_in', selectedNoteDPE.value.join(','))
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
    await fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines?${searchParams.toString()}`)
      .then(data => data.json())
      .then(async data => {
        const computedResults = []
        for (const result of data.results) {
          const individualResult = { ...result }
          // Try to complete the address using the raw address if available
          if (!result.nom_rue_ban && result.adresse_brut) {
            individualResult.nom_rue_ban = result.adresse_brut
          }
          if (!result.code_postal_ban && result.code_postal_brut) {
            individualResult.code_postal_ban = result.code_postal_brut
          }
          if (!result.nom_commune_ban && result.nom_commune_brut) {
            individualResult.nom_commune_ban = result.nom_commune_brut
          }
          // Convert X/Y (referentiel epsg 2154 lambert 93) to latitude/longitude (WGS84)
          if (!result.coordonnee_cartographique_x_ban && !result.coordonnee_cartographique_y_ban && result.adresse_complete_brut) {
            await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(result.adresse_complete_brut)}`)
              .then(response => response.json())
              .then(data => {
                if (data.features && data.features.length > 0) {
                  const coords = data.features[0].geometry.coordinates
                  individualResult.longitude = coords[0]
                  individualResult.latitude = coords[1]
                  individualResult.coordonnee_cartographique_x_ban = data.features[0].properties.x
                  individualResult.coordonnee_cartographique_y_ban = data.features[0].properties.y
                  individualResult.code_insee_ban = data.features[0].properties.citycode
                }
              })
          } else {
            const x = result.coordonnee_cartographique_x_ban
            const y = result.coordonnee_cartographique_y_ban
            if (!x || !y) {
              individualResult.longitude = 0
              individualResult.latitude = 0
            } else {
              const gpsCoordinates = proj4('+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs +type=crs', 'EPSG:4326').forward([x, y])
              individualResult.longitude = gpsCoordinates[0]
              individualResult.latitude = gpsCoordinates[1]
            }
          }
          computedResults.push(individualResult)
        }
        results.value = computedResults
      })
    loading.value = false
    firstResearchDone.value = true
  }
</script>
