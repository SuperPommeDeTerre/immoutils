<template>
  <v-container fluid>
    <h1>{{ t('searchbydpe.title') }}</h1>

    <v-form validate-on="submit lazy" @submit="loadDPEItems({ page: 1, itemsPerPage: itemsPerPage })" @submit.prevent="validateCriterias">
      <v-container fluid>
        <v-row>
          <v-col cols="4">
            <v-text-field
              v-model="selectedCityName"
              :hint="t('searchbydpe.search.city.hint')"
              :label="t('searchbydpe.search.city.label')"
            />
          </v-col>

          <v-col cols="4">
            <v-combobox
              v-model="cityPostalCodes"
              append-icon=""
              chips
              clearable
              closable-chips
              :hint="t('searchbydpe.search.cityPostalCodes.hint')"
              :label="t('searchbydpe.search.cityPostalCodes.label')"
              multiple
            />
          </v-col>

          <v-col cols="4">
            <v-select
              v-model="selectedBuildingTypes"
              chips
              clearable
              closable-chips
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
              :hint="t('searchbydpe.search.dateDPE.hint')"
              input-format="dd/mm/yyyy"
              :label="t('searchbydpe.search.dateDPE.label')"
              :max="new Date().toISOString().split('T')[0]"
              min="2013-01-01"
              multiple="range"
              prepend-icon=""
              prepend-inner-icon="$calendar"
            />
          </v-col>

          <v-col cols="4">
            <SelectDpeTag v-model="selectedNoteDPE" />
          </v-col>

          <v-col cols="4">
            <v-number-input
              v-model="buildingSurface"
              clearable
              control-variant="hidden"
              :hint="t('searchbydpe.search.buildingSurface.hint')"
              :label="t('searchbydpe.search.buildingSurface.label')"
              prepend-inner-icon="mdi-ruler-square"
            />
          </v-col>
        </v-row>
      </v-container>

      <v-btn
        block
        class="mt-2"
        :disabled="loading"
        prepend-icon="mdi-magnify"
        type="submit"
      >
        {{ t('searchbydpe.search.searchButton') }}
      </v-btn>
    </v-form>
  </v-container>

  <v-container fluid>
    <template v-if="$vuetify.display.xs">
      <v-data-iterator
        v-if="firstSearchDone"
        :items="results"
        :items-per-page="itemsPerPage"
        :loading="loading"
      >
        <template #header="{ page, pageCount, prevPage, nextPage }">
          <h1 class="text-headline-large font-weight-bold d-flex justify-space-between mt-0 mb-4 align-center">
            <div class="d-flex align-center">
              <v-btn
                class="me-8"
                variant="text"
              >
                <span class="text-decoration-underline text-none">See all</span>
              </v-btn>

              <div class="d-inline-flex">
                <v-btn
                  class="me-2"
                  :disabled="page === 1"
                  icon="mdi-arrow-left"
                  size="small"
                  variant="tonal"
                  @click="prevPage"
                />

                <v-btn
                  :disabled="page === pageCount"
                  icon="mdi-arrow-right"
                  size="small"
                  variant="tonal"
                  @click="nextPage"
                />
              </div>
            </div>
          </h1>
        </template>

        <template #default="{ items }">
          <v-row>
            <v-col
              v-for="(item, i) in items"
              :key="i"
              cols="12"
              sm="6"
              xl="3"
            >
              <v-card variant="tonal">
                <v-card-title class="d-flex align-center">
                  <h5 class="mt-0 mb-1">
                    <GoogleMapsLink v-if="item.raw.full_address" :query="item.raw.full_address" :text="item.raw.full_address" />

                    <v-chip v-else color="warning" prepend-icon="mdi-map-marker-question">
                      {{ t('searchbydpe.results.noAddress') }}
                    </v-chip>
                  </h5>
                </v-card-title>

                <v-card-subtitle>
                  <template v-for="dpeNote in dpeNotes">
                    <v-chip
                      v-if="item.raw.dpe_tag as DpeTag === dpeNote.value as DpeTag"
                      :key="dpeNote.label"
                      class="me-1"
                      :color="dpeNote.color"
                      label
                      variant="flat"
                    >{{ dpeNote.label }}</v-chip>
                  </template>

                  <v-icon v-if="item.raw.building_type" class="me-1">
                    {{ getBuildingTypeIcon(item.raw.building_type) }}
                  </v-icon>

                  {{ capitalize(getBuildingTypeDisplayString(item.raw.building_type)) }}

                  <template v-if="item.raw.habitable_surface">
                    - {{ new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(item.raw.habitable_surface) }} m²
                  </template>
                </v-card-subtitle>

                <v-card-text>
                  <v-list lines="one">
                    <v-list-item
                      v-if="item.raw.building_year"
                      :subtitle="item.raw.building_year"
                      :title="t('searchbydpe.headers.buildingYear')"
                    />

                    <v-list-item
                      v-if="item.raw.parcel_surface"
                      :subtitle="new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(item.raw.parcel_surface)"
                      :title="t('searchbydpe.headers.parcelSurface')"
                    />

                    <v-list-item v-else>
                      <v-btn
                        density="compact"
                        :disabled="!item.raw.longitude || !item.raw.latitude || !item.raw.insee_code_ban"
                        icon="mdi-texture-box"
                        :title="t('searchbydpe.results.computeParcelSurface')"
                        @click="computeParcelSurface(item.raw)"
                      />
                    </v-list-item>

                    <v-list-item
                      :title="t('searchbydpe.headers.dpeNumber')"
                    >
                      <v-list-item-subtitle>
                        <a
                          v-if="item.raw.dpe_date >= DPE_REPOSITORY_CHANGE_DATE"
                          :href="`https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${item.raw.dpe_number}`"
                          target="_blank"
                          :title="t('searchbydpe.results.viewDPE')"
                        >
                          {{ item.raw.dpe_number }}
                        </a>

                        <template v-else>{{ item.raw.dpe_number }}</template>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>

                <v-card-actions>
                  <v-btn
                    :disabled="!item.raw.longitude || !item.raw.latitude || !item.raw.insee_code_ban"
                    icon="mdi-map"
                    :title="t('searchbydpe.results.viewCadastre')"
                    @click="openCadastre(item.raw)"
                  />

                  <v-btn
                    :disabled="!item.raw.longitude || !item.raw.latitude || !item.raw.insee_code_ban"
                    icon="mdi-alert"
                    :title="t('searchbydpe.results.viewGeorisques')"
                    @click="openGeorisques(item.raw)"
                  />

                  <v-btn
                    :disabled="!item.raw.longitude || !item.raw.latitude"
                    icon="mdi-currency-eur"
                    :title="t('searchbydpe.results.viewPricesMap')"
                    @click="openPricesMap(item.raw)"
                  />
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <template #loader>
          <v-row>
            <v-col
              v-for="(_, k) in [0, 1, 2, 3]"
              :key="k"
              cols="12"
              sm="6"
              xl="3"
            >
              <v-skeleton-loader
                class="border"
                type="image, article"
              />
            </v-col>
          </v-row>
        </template>
      </v-data-iterator>
    </template>

    <template v-else>
      <v-data-table-server
        v-if="firstSearchDone"
        v-model:sort-by="resultsSortBy"
        density="compact"
        fixed-header
        :headers="resultsHeaders"
        :hover="true"
        :items="results"
        :items-length="totalDPEItems"
        :items-per-page="itemsPerPage"
        :loading="loading"
        sort-asc-icon="mdi-sort-ascending"
        sort-desc-icon="mdi-sort-descending"
        sort-icon="mdi-swap-vertical"
        @update:items-per-page="changeItemPerPage"
        @update:options="loadDPEItems"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@10" />
        </template>

        <template #item="{ item }">
          <tr>
            <td>
              <a v-if="item.dpe_date >= DPE_REPOSITORY_CHANGE_DATE" :href="`https://observatoire-dpe-audit.ademe.fr/afficher-dpe/${item.dpe_number}`" target="_blank" :title="t('searchbydpe.results.viewDPE')">{{ item.dpe_number }}</a>
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

            <td>
              <template v-if="item.parcel_surface">
                {{ new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(item.parcel_surface) }} m²
              </template>

              <template v-else>
                <v-btn
                  density="compact"
                  :disabled="!item.longitude || !item.latitude || !item.insee_code_ban"
                  icon="mdi-texture-box"
                  :title="t('searchbydpe.results.computeParcelSurface')"
                  @click="computeParcelSurface(item)"
                />
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
      </v-data-table-server>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
  import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'
  import { capitalize, ref, shallowRef, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import GoogleMapsLink from '@/components/GoogleMapsLink.vue'
  import SelectDpeTag from '@/components/SelectDpeTag.vue'
  import { DPE_REPOSITORY_CHANGE_DATE, DpeBuildingType, dpeNotes, type DpeResult, type DpeTag, useApiDpeStore } from '@/stores/api-dpe'
  import { useApiGeocodageStore } from '@/stores/api-geocodage'

  const { t } = useI18n()

  const firstSearchDone = ref(false)
  const loading = ref(false)

  const today = new Date()
  const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const selectedCityName = ref(localStorage.getItem('lastUsedCityName') || '')
  const cityPostalCodes = ref<number[]>(JSON.parse(localStorage.getItem('lastUsedPostalCodes') || '[]'))
  const selectedNoteDPE = ref<DpeTag[]>([])
  const selectedDateDPE = shallowRef([firstDayOfCurrentMonth, today])
  const selectedBuildingTypes = ref([])
  const buildingSurface = ref<number | null>(null)
  const totalDPEItems = ref(0)
  const itemsPerPage = ref(Number.parseInt(localStorage.getItem('lastUsedItemsPerPage') ?? '50'))

  const dpeApiStore = useApiDpeStore()
  const geocodageApiStore = useApiGeocodageStore()

  const resultsSortBy = ref<SortItem[]>([{ key: 'dpe_date', order: 'desc' }])

  const resultsHeaders = ref([
    { title: t('searchbydpe.headers.dpeNumber'), key: 'dpe_number' },
    { title: t('searchbydpe.headers.dpeDate'), key: 'dpe_date' },
    { title: t('searchbydpe.headers.dpeTag'), key: 'dpe_tag' },
    { title: t('searchbydpe.headers.habitableSurface'), key: 'habitable_surface' },
    { title: t('searchbydpe.headers.parcelSurface'), key: 'parcel_surface' },
    { title: t('searchbydpe.headers.buildingType'), key: 'building_type' },
    { title: t('searchbydpe.headers.buildingYear'), key: 'building_year' },
    { title: t('searchbydpe.headers.address'), key: 'address', sortable: false },
    { title: t('searchbydpe.headers.links'), key: 'liens', align: 'center', sortable: false },
  ] as const)

  const results = ref<DpeResult[]>([])

  watch(cityPostalCodes, (newVal, _oldVal) => localStorage.setItem('lastUsedPostalCodes', JSON.stringify(newVal)))
  watch(selectedCityName, (newVal, _oldVal) => localStorage.setItem('lastUsedCityName', newVal ?? ''))
  watch(itemsPerPage, (newVal, _oldVal) => localStorage.setItem('lastUsedItemsPerPage', newVal.toString()))

  // Sadly, the watch isn't fired with v-data-table-server, so we must handle the event on the table and change the value manually
  function changeItemPerPage (nbItemsPerPage: number) {
    itemsPerPage.value = nbItemsPerPage
  }

  async function computeParcelSurface (result: DpeResult) {
    if (!result.longitude || !result.latitude || !result.insee_code_ban) {
      return
    }
    const parcelId = await getDpeParcelId(result)
    if (parcelId) {
      const parcelInfo = await geocodageApiStore.getInformationFromParcelId(parcelId)
      result.parcel_surface = parcelInfo.surface
    }
  }
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

  function getBuildingTypeIcon (buildingType: DpeBuildingType | string | null): string {
    if (typeof buildingType === 'string' && Object.values(DpeBuildingType).includes(buildingType as DpeBuildingType)) {
      buildingType = buildingType as DpeBuildingType
    }
    if (typeof buildingType === 'string') {
      switch (buildingType) {
        case DpeBuildingType.HOUSE: { return 'mdi-home' }
        case DpeBuildingType.APARTMENT: { return 'mdi-floor-plan' }
        case DpeBuildingType.BUILDING: { return 'mdi-office-building' }
      }
    }
    return 'mdi-cancel'
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

  async function getDpeParcelId (result: DpeResult) {
    if (!result.parcelId) {
      const parcelId = await geocodageApiStore.getCadastreParcelId({
        longitude: result.longitude ?? 0,
        latitude: result.latitude ?? 0,
        cityInseeCode: result.insee_code_ban ?? null,
      })
      result.parcelId = parcelId
    }
    return result.parcelId
  }

  async function openCadastre (result: DpeResult) {
    // Get closest parcel number from coordinates
    const zoomLevel = 18

    let cadastreLink = `https://cadastre.data.gouv.fr/map?style=ortho&parcelleId=${await getDpeParcelId(result)}#${zoomLevel}/`
    if (result.longitude != 0 && result.latitude != 0) {
      cadastreLink += `${result.latitude}/${result.longitude}`
    }
    window.open(cadastreLink, '_blank')
    return false
  }

  function validateCriterias (e: Event) {
    e.preventDefault()
  }

  interface LoadDPEItemsParams {
    page: number
    itemsPerPage: number
    sortBy?: { key: string, order: 'asc' | 'desc' }[] | null
  }

  function loadDPEItems ({ page, itemsPerPage, sortBy }: LoadDPEItemsParams) {
    firstSearchDone.value = true
    loading.value = true
    void dpeApiStore.searchWithCriterias({
      city_name: selectedCityName.value ?? null,
      city_postal_codes: cityPostalCodes.value ?? null,
      tag: selectedNoteDPE.value ?? null,
      surface: buildingSurface.value ?? null,
      from_date: selectedDateDPE.value?.[0] ? new Date(selectedDateDPE.value[0]) : null,
      to_date: selectedDateDPE.value?.[1] ? new Date(selectedDateDPE.value[1]) : null,
      building_type: selectedBuildingTypes.value ?? null,
      page,
      itemsPerPage,
      sortBy,
    }).then(({ items, total }) => {
      results.value = items
      totalDPEItems.value = total
      loading.value = false
    })
  }
</script>
