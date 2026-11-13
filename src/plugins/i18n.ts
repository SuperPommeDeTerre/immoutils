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
        city: {
          label: 'City',
          hint: 'Find the city name as entered by the diagnostician.',
        },
        buildingType: 'Building type',
        dateDPE: {
          label: 'Diagnostic issue date',
          hint: 'Warning: Searches before 07-01-2021 may take longer.',
        },
        cityPostalCodes: {
          label: 'Postal codes',
          hint: 'You can enter multiple postal codes to search across multiple cities.',
        },
        dpeTag: 'EPD tag',
        buildingSurface: {
          label: 'Habitable surface',
          hint: 'Surface in m² (a search within +/- 10% will be performed).',
        },
        buildingSurfaceHint: 'Surface in m² (a search within +/- 10% will be performed)',
        searchButton: 'Search',
      },
      headers: {
        dpeNumber: 'EPD No.',
        dpeDate: 'Issuing date',
        dpeTag: 'EPD tag',
        habitableSurface: 'Habitable surface',
        parcelId: 'Parcel ID',
        parcelSurface: 'Parcel surface',
        buildingType: 'Building type',
        buildingYear: 'Year of construction',
        address: 'Address',
        links: 'Links',
      },
      results: {
        computeParcelSurface: 'Compute parcel surface',
        viewDPE: 'View DPE',
        viewCadastre: 'View cadastre',
        viewGeorisques: 'View georisques',
        viewPricesMap: 'View recent building sales',
        buildingTypeUnknown: 'unknown',
        noAddress: 'Address not available',
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
        city: {
          label: 'Commune',
          hint: 'Recherche dans le nom de la commune telle que saisie par le diagnostiqueur.',
        },
        buildingType: 'Type de bien',
        dateDPE: {
          label: 'Date d\'établissement du DPE',
          hint: 'Attention : Les recherches avant le 01/07/2021 peuvent être plus longues.',
        },
        cityPostalCodes: {
          label: 'Codes postaux',
          hint: 'Vous pouvez saisir plusieurs codes postaux pour rechercher sur plusieurs communes.',
        },
        dpeTag: 'Etiquette DPE',
        buildingSurface: {
          label: 'Surface habitable',
          hint: 'Surface en m² (une recherche à +/- 10% sera effectuée).',
        },
        searchButton: 'Rechercher',
      },
      headers: {
        dpeNumber: 'N° DPE',
        dpeDate: 'Date d\'établissement',
        dpeTag: 'Etiquette DPE',
        habitableSurface: 'Surface habitable',
        parcelId: 'N° de parcelle',
        parcelSurface: 'Surface parcelle',
        buildingType: 'Type de bâtiment',
        buildingYear: 'Année de construction',
        address: 'Adresse',
        links: 'Liens',
      },
      results: {
        computeParcelSurface: 'Calculer la surface de la parcelle',
        viewDPE: 'Voir le DPE',
        viewCadastre: 'Voir le cadastre',
        viewGeorisques: 'Voir les géorisques',
        viewPricesMap: 'Voir la carte des ventes immobilières récentes',
        buildingTypeUnknown: 'inconnu',
        noAddress: 'Adresse non disponible',
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
