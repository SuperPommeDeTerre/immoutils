<template>
  <v-select
    v-model="selectedNoteDPE"
    chips
    clearable
    closable-chips
    item-title="label"
    item-value="value"
    :items="dpeNotes"
    :label="t('searchbydpe.search.dpeTag')"
    multiple
  >
    <template #item="{ props: dpeNoteProps, item }">
      <v-list-item v-bind="dpeNoteProps">
        <template #prepend="{ isSelected, select }">
          <v-list-item-action start>
            <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
          </v-list-item-action>
        </template>

        <template #title>
          <v-chip :color="item.color" label variant="flat">
            {{ item.label }}
          </v-chip>
        </template>
      </v-list-item>
    </template>

    <template #chip="{ item, props }">
      <v-chip
        :key="item.value"
        v-bind="props"
        closable
        :color="item.color"
        label
        variant="flat"
      >
        {{ item.label }}
      </v-chip>
    </template>
  </v-select>
</template>
<script lang="ts" setup>
  import { watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { dpeNotes, DpeTag } from '@/stores/api-dpe'

  const { t } = useI18n()

  const selectedNoteDPE = defineModel<DpeTag[]>({
    required: true,
  })

  watch(selectedNoteDPE, (_newValue, _oldValue) => {
    selectedNoteDPE.value.sort((a, b) => DpeTag[a].localeCompare(DpeTag[b]))
  })
</script>
