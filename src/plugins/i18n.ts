import { createI18n } from 'vue-i18n'
import { en, fr } from 'vuetify/locale'

const messages = {
  en: {
    $vuetify: {
      ...en,
    },
    generic: {
      close: 'Close',
    },
    googleMapsLink: {
      title: 'View on Google Maps',
      defaulttext: 'View on Google Maps',
    },
    buildingtypes: {
      house: 'House',
      apartment: 'Apartment',
      building: 'Building',
    },
    searchbydpe: {
      title: 'Search by Energetical Performance Diagnostic (French DPE)',
      search: {
        city: 'City',
        buildingType: 'Building type',
        dateDPE: 'EPD issue date',
        dpeTag: 'EPD tag',
        buildingSurface: 'Habitable surface',
        buildingSurfaceHint: 'Surface in m² (a search within +/- 10% will be performed)',
        searchButton: 'Search',
      },
      headers: {
        dpeNumber: 'EPD No.',
        dpeDate: 'Issuing date',
        dpeTag: 'EPD tag',
        habitableSurface: 'Habitable surface',
        buildingType: 'Building type',
        buildingYear: 'Year of construction',
        address: 'Address',
        links: 'Links',
      },
      results: {
        viewDPE: 'View DPE',
        viewCadastre: 'View cadastre',
        viewGeorisques: 'View georisques',
        viewPricesMap: 'View recent building sales',
        buildingTypeUnknown: 'unknown',
      },
    },
  },
  fr: {
    $vuetify: {
      ...fr,
    },
    generic: {
      close: 'Fermer',
    },
    googleMapsLink: {
      title: 'Voir sur Google Maps',
      defaulttext: 'Voir sur Google Maps',
    },
    buildingtypes: {
      house: 'Maison',
      apartment: 'Appartement',
      building: 'Immeuble',
    },
    searchbydpe: {
      title: 'Recherche par DPE',
      search: {
        city: 'Commune',
        buildingType: 'Type de bien',
        dateDPE: 'Date d\'établissement du DPE',
        dateDPEHint: 'Attention : Les recherches avant le 01/07/2021 peuvent être plus longues',
        cityPostalCodes: 'Codes postaux',
        dpeTag: 'Etiquette DPE',
        buildingSurface: 'Surface habitable',
        buildingSurfaceHint: 'Surface en m² (une recherche à +/- 10% sera effectuée)',
        searchButton: 'Rechercher',
      },
      headers: {
        dpeNumber: 'N° DPE',
        dpeDate: 'Date d\'établissement',
        dpeTag: 'Etiquette DPE',
        habitableSurface: 'Surface habitable',
        buildingType: 'Type de bâtiment',
        buildingYear: 'Année de construction',
        address: 'Adresse',
        links: 'Liens',
      },
      results: {
        viewDPE: 'Voir le DPE',
        viewCadastre: 'Voir le cadastre',
        viewGeorisques: 'Voir les géorisques',
        viewPricesMap: 'Voir la carte des ventes immobilières récentes',
        buildingTypeUnknown: 'inconnu',
      },
    },
  },
}

export default createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  globalInjection: true,
  messages,
})
