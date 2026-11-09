<template>
  <v-app>
    <v-toolbar v-if="$vuetify.display.xs" extended>
      <v-toolbar-title text="Immo'utils" />

      <template #extension>
        <v-tabs>
          <v-tab text="Accueil" :to="{ name: Pages.HOME }" />
          <v-tab text="Recherche par DPE" :to="{ name: Pages.SEARCH_BY_DPE }" />
        </v-tabs>
      </template>
    </v-toolbar>

    <v-navigation-drawer
      v-else
      expand-on-hover
      permanent
      rail
    >
      <v-list>
        <v-list-item prepend-icon="mdi-home" title="Accueil" :to="{ name: Pages.HOME }" />
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-home-lightning-bolt" title="Rechercher par DPE" :to="{ name: Pages.SEARCH_BY_DPE }" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
<script lang="ts" setup>
  import { Pages } from './router'
</script>
