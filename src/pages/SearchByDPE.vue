<template>
  <v-container fluid>
    <h1>{{ t('searchbydpe.title') }}</h1>

    <v-form validate-on="submit lazy" @submit="search" @submit.prevent="validateCriterias">
      <v-container fluid>
        <v-row>
          <v-col cols="4">
            <v-text-field
              v-model="selectedCityName"
              :label="t('searchbydpe.search.city')"
            />
          </v-col>

          <v-col cols="4">
            <v-combobox
              v-model="cityPostalCodes"
              append-icon=""
              chips
              clearable
              :label="t('searchbydpe.search.cityPostalCodes')"
              multiple
            >
              <template #selection="{ item }">
                <v-chip closable small>{{ item }}</v-chip>
              </template>
            </v-combobox>
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="selectedBuildingTypes"
              chips
              clearable
              :item-title="item => getBuildingTypeDisplayString(item)"
              :item-value="item => item"
              :items="Object.values(DpeBuildingType)"
              :label="t('searchbydpe.search.buildingType')"
              multiple
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="4">
            <v-date-input
              v-model="selectedDateDPE"
              first-day-of-week="1"
              :hint="t('searchbydpe.search.dateDPEHint')"
              input-format="dd/mm/yyyy"
              :label="t('searchbydpe.search.dateDPE')"
              :max="new Date().toISOString().split('T')[0]"
              min="2013-01-01"
              multiple="range"
              prepend-icon=""
              prepend-inner-icon="$calendar"
            />
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="selectedNoteDPE"
              chips
              clearable
              item-title="label"
              item-value="value"
              :items="dpeNotes"
              :label="t('searchbydpe.search.dpeTag')"
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
              :hint="t('searchbydpe.search.buildingSurfaceHint')"
              :label="t('searchbydpe.search.buildingSurface')"
              prepend-inner-icon="mdi-ruler-square"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-btn block class="mt-2" prepend-icon="mdi-magnify" type="submit">{{ t('searchbydpe.search.searchButton') }}</v-btn>
    </v-form>
  </v-container>

  <v-container fluid>
    <v-data-table
      v-if="firstSearchDone"
      v-model:sort-by="resultsSortBy"
      density="compact"
      fixed-header
      :headers="resultsHeaders"
      :hover="true"
      :items="results"
      :items-per-page="100"
      :loading="loading"
      sort-asc-icon="mdi-sort-ascending"
      sort-desc-icon="mdi-sort-descending"
      sort-icon="mdi-swap-vertical"
    >
      <template #loading>
        <v-skeleton-loader type="table-row@10" />
      </template>

      <template #item="{ item }">
        <tr>
          <td>
            <a v-if="item.dpe_date < DPE_REPOSITORY_CHANGE_DATE" href="`https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${item.dpe_number}`" target="_blank" :title="t('searchbydpe.results.viewDPE')">{{ item.dpe_number }}</a>
            <template v-else>{{ item.dpe_number }}</template>
          </td>

          <td>{{ item.dpe_date.toLocaleDateString() }}</td>

          <td>
            <template v-for="dpeNote in dpeNotes">
              <v-chip
                v-if="item.dpe_tag as DpeTag === dpeNote.value as DpeTag"
                :key="dpeNote.label"
                :color="dpeNote.color"
                label
                variant="flat"
              >{{ dpeNote.label }}</v-chip>
            </template>
          </td>

          <td>
            <template v-if="item.habitable_surface">
              {{ new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(item.habitable_surface) }} m²
            </template>
          </td>

          <td>{{ capitalize(getBuildingTypeDisplayString(item.building_type)) }}</td>
          <td>{{ item.building_year }}</td>

          <td>
            <GoogleMapsLink v-if="item.full_address" :query="item.full_address" :text="item.full_address" />

            <v-chip v-else color="warning" prepend-icon="mdi-map-marker-question">
              {{ t('searchbydpe.results.noAddress') }}
            </v-chip>
          </td>

          <td class="text-center">
            <v-btn
              density="compact"
              :disabled="!item.longitude || !item.latitude || !item.insee_code_ban"
              icon="mdi-map"
              :title="t('searchbydpe.results.viewCadastre')"
              @click="openCadastre(item)"
            />

            <v-btn
              density="compact"
              :disabled="!item.longitude || !item.latitude || !item.insee_code_ban"
              icon="mdi-alert"
              :title="t('searchbydpe.results.viewGeorisques')"
              @click="openGeorisques(item)"
            />

            <v-btn
              density="compact"
              :disabled="!item.longitude || !item.latitude"
              icon="mdi-currency-eur"
              :title="t('searchbydpe.results.viewPricesMap')"
              @click="openPricesMap(item)"
            />
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts" setup>
  import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'
  import { capitalize, ref, shallowRef, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import GoogleMapsLink from '@/components/GoogleMapsLink.vue'
  import { DPE_REPOSITORY_CHANGE_DATE, DpeBuildingType, type DpeResult, DpeTag, useApiDpeStore } from '@/stores/api-dpe'
  import { useApiGeocodageStore } from '@/stores/api-geocodage'

  const { t } = useI18n()

  const firstSearchDone = ref(false)
  const loading = ref(false)

  const today = new Date()
  const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const selectedCityName = ref(localStorage.getItem('lastUsedCityName') || '')
  const cityPostalCodes = ref<number[]>(JSON.parse(localStorage.getItem('lastUsedPostalCodes') || '[]'))
  const selectedNoteDPE = ref([])
  const selectedDateDPE = shallowRef([firstDayOfCurrentMonth, today])
  const selectedBuildingTypes = ref([])
  const buildingSurface = ref<number | null>(null)

  const dpeApiStore = useApiDpeStore()
  const geocodageApiStore = useApiGeocodageStore()

  const resultsSortBy = ref<SortItem[]>([{ key: 'dpe_date', order: 'asc' }])

  const resultsHeaders = ref([
    { title: t('searchbydpe.headers.dpeNumber'), key: 'dpe_number' },
    { title: t('searchbydpe.headers.dpeDate'), key: 'dpe_date' },
    { title: t('searchbydpe.headers.dpeTag'), key: 'dpe_tag' },
    { title: t('searchbydpe.headers.habitableSurface'), key: 'habitable_surface' },
    { title: t('searchbydpe.headers.buildingType'), key: 'building_type' },
    { title: t('searchbydpe.headers.buildingYear'), key: 'building_year' },
    { title: t('searchbydpe.headers.address'), key: 'address', sortable: false },
    { title: t('searchbydpe.headers.links'), key: 'liens', align: 'center', sortable: false },
  ] as const)

  const dpeNotes = (Object.keys(DpeTag) as Array<keyof typeof DpeTag>).map(dpeTag => {
    return {
      label: dpeTag as string,
      value: dpeTag,
      color: (() => {
        switch (dpeTag) {
          case DpeTag.A: { return 'green-darken-4' }
          case DpeTag.B: { return 'green-darken-1' }
          case DpeTag.C: { return 'light-green-darken-1' }
          case DpeTag.D: { return 'yellow-accent-3' }
          case DpeTag.E: { return 'orange-accent-3' }
          case DpeTag.F: { return 'deep-orange-darken-3' }
          case DpeTag.G: { return 'red-darken-4' }
          case DpeTag.N: { return 'grey-darken-1' }
        }
      })(),
    }
  })

  const results = ref<DpeResult[]>([])

  watch(cityPostalCodes, (newVal, _oldVal) => {
    localStorage.setItem('lastUsedPostalCodes', JSON.stringify(newVal))
  })

  watch(selectedCityName, (newVal, _oldVal) => {
    localStorage.setItem('lastUsedCityName', newVal ?? '')
  })

  function getBuildingTypeDisplayString (buildingType: DpeBuildingType | string | null): string {
    if (typeof buildingType === 'string' && Object.values(DpeBuildingType).includes(buildingType as DpeBuildingType)) {
      buildingType = buildingType as DpeBuildingType
    }
    if (typeof buildingType === 'string') {
      switch (buildingType) {
        case DpeBuildingType.HOUSE: { return t('buildingtypes.house') }
        case DpeBuildingType.APARTMENT: { return t('buildingtypes.apartment') }
        case DpeBuildingType.BUILDING: { return t('buildingtypes.building') }
      }
    }
    return t('searchbydpe.results.buildingTypeUnknown')
  }

  function openPricesMap (result: DpeResult) {
    const pricesMapURLParams = new URLSearchParams({
      onglet: 'carte',
      filtre: 'tous',
      level: 'section',
      code: '',
      lng: (result.longitude ?? 0).toString(),
      lat: (result.latitude ?? 0).toString(),
      zoom: '16.00',
    })
    window.open(`https://explore.data.gouv.fr/fr/immobilier?${pricesMapURLParams.toString()}`, '_blank')
    return false
  }

  function openGeorisques (result: DpeResult) {
    const georisqueURLParams = new URLSearchParams({
      'form-adresse': 'true',
      'isCadastre': 'false',
      'city': result.city_name_ban ?? '',
      'type': 'adresse',
      'typeForm': 'adresse',
      'codeInsee': result.insee_code_ban ?? '',
      'lon': (result.longitude ?? 0).toString(),
      'lat': (result.latitude ?? 0).toString(),
      'longitude': (result.longitude ?? 0).toString(),
      'latitude': (result.latitude ?? 0).toString(),
      'commune': result.city_name_ban ?? '',
      'adresse': `${result.street_number_ban ?? ''} ${result.street_name_ban}, ${result.postal_code_ban} ${result.city_name_ban ?? ''}`,
    })
    window.open(`https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi/rapport2?${georisqueURLParams.toString()}`, '_blank')
    return false
  }

  async function openCadastre (result: DpeResult) {
    // Get closest parcel number from coordinates
    const zoomLevel = 18

    const parcelId = await geocodageApiStore.getCadastreParcelId({
      longitude: result.longitude ?? 0,
      latitude: result.latitude ?? 0,
      cityInseeCode: result.insee_code_ban ?? null,
    })
    let cadastreLink = `https://cadastre.data.gouv.fr/map?style=ortho&parcelleId=${parcelId}#${zoomLevel}/`
    if (result.longitude != 0 && result.latitude != 0) {
      cadastreLink += `${result.latitude}/${result.longitude}`
    }
    window.open(cadastreLink, '_blank')
    return false
  }

  function validateCriterias (e: Event) {
    e.preventDefault()
  }

  async function search () {
    firstSearchDone.value = true
    loading.value = true
    results.value = []
    await dpeApiStore.searchWithCriterias({
      city_name: selectedCityName.value ?? null,
      city_postal_codes: cityPostalCodes.value ?? null,
      tag: selectedNoteDPE.value ?? null,
      surface: buildingSurface.value ?? null,
      from_date: selectedDateDPE.value?.[0] ? new Date(selectedDateDPE.value[0]) : null,
      to_date: selectedDateDPE.value?.[1] ? new Date(selectedDateDPE.value[1]) : null,
      building_type: selectedBuildingTypes.value ?? null,
    })
    results.value = dpeApiStore.dpe_established
    loading.value = false
  }
</script>
