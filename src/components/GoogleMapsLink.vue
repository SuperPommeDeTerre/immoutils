<template>
  <v-tooltip
    location="start"
    :text="title ?? t('googleMapsLink.title')"
  >
    <template #activator="{ props }">
      <a v-bind="props" :href="`https://www.google.com/maps/search/?api=1&query=${query}`" target="_blank" :title="title ?? t('googleMapsLink.title')">{{ text ?? t('googleMapsLink.defaulttext') }}</a>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  defineProps<{
    query: string
    text?: string
    title?: string
  }>()
</script>
