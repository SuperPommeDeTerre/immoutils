/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { en, fr } from 'vuetify/locale'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)

const messages = {
  en: {
    $vuetify: {
      ...en,
    },
  },
  fr: {
    $vuetify: {
      ...fr,
    },
  },
}
const i18n = createI18n({
  legacy: false, // Vuetify does not support the legacy mode of vue-i18n
  locale: 'fr',
  fallbackLocale: 'en',
  messages,
})

const vuetify = createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
})

app.use(i18n)
app.use(vuetify)

registerPlugins(app)

app.mount('#app')
