/**
 * Single Source of Truth for Schema.org JSON-LD structured data for WildFloral
 */

export const BASE_URL = 'https://www.wildfloral.online'
export const LOGO_URL = `${BASE_URL}/logo.png`
export const INSTAGRAM_URL = 'https://www.instagram.com/wildfloral_beauty_destination'
export const PHONE_NUMBER = '+91 8838894677'
export const FORMATTED_PHONE = '+91-8838894677'

export const BUSINESS_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '3-1/2, Neela Mega Nagar, 1st Cross',
  addressLocality: 'Hosur',
  addressRegion: 'Tamil Nadu',
  postalCode: '635109',
  addressCountry: 'IN',
}

// TODO: Add exact geo coordinates (latitude, longitude) if provided by business owner
// Example:
// export const BUSINESS_GEO = {
//   '@type': 'GeoCoordinates',
//   latitude: 12.7409,
//   longitude: 77.8253,
// }

export const BUSINESS_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '09:00',
    closes: '21:00',
  },
]

/**
 * Organization Schema
 */
export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WildFloral',
  alternateName: 'WildFloral Beauty & Fashion',
  url: BASE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  sameAs: [INSTAGRAM_URL],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: PHONE_NUMBER,
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil'],
    },
  ],
})

/**
 * WebSite Schema
 */
export const getWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'WildFloral',
  url: BASE_URL,
  inLanguage: 'en-IN',
  description:
    'A one-stop luxury beauty and haute fashion destination in Hosur featuring master artisans, private chamber sanctums, and elevated doorstep experiences.',
})

/**
 * LocalBusiness (BeautySalon + ClothingStore) Schema
 */
export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['BeautySalon', 'ClothingStore'],
  '@id': `${BASE_URL}/#localbusiness`,
  name: 'WildFloral',
  alternateName: 'WildFloral Beauty & Fashion Studio',
  description:
    'A one-stop luxury beauty and haute fashion destination in Hosur featuring master artisans, private chamber sanctums, and elevated doorstep experiences. Services include bridal, couture, and personalized beauty transformations.',
  url: BASE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  telephone: PHONE_NUMBER,
  address: BUSINESS_ADDRESS,
  openingHoursSpecification: BUSINESS_HOURS,
  areaServed: {
    '@type': 'City',
    name: 'Hosur',
  },
  sameAs: [INSTAGRAM_URL],
  paymentAccepted: 'Cash, UPI, Credit Card, Debit Card',
  currenciesAccepted: 'INR',
  // TODO: Add priceRange if specific range tier is determined (e.g. "₹₹ - ₹₹₹")
  // TODO: Add geo coordinates if exact map pin coordinates are provided
})

/**
 * BreadcrumbList Schema generator
 */
export const getBreadcrumbSchema = (
  items: { name: string; url: string }[],
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
  })),
})

/**
 * Service / OfferCatalog Schema for /services
 */
export const getServicesSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  name: 'WildFloral Beauty & Fashion Services in Hosur',
  description:
    'Comprehensive luxury beauty therapy, bridal makeup, hair care, skin treatments, and bespoke fashion couture in Hosur.',
  url: `${BASE_URL}/services`,
  itemListElement: [
    {
      '@type': 'OfferCatalog',
      name: 'Beauty Services',
      itemListElement: [
        {
          '@type': 'Service',
          name: 'Bridal Makeup & Styling',
          description:
            'Comprehensive bridal beauty transformations and personalized styling sessions for weddings and special occasions in Hosur.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
        {
          '@type': 'Service',
          name: 'Hair Styling & Treatments',
          description:
            'Artisanal hair styling, cutting, texturing, and nourishing hair spa treatments.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
        {
          '@type': 'Service',
          name: 'Skin & Facial Therapies',
          description:
            'Custom facial therapies, rejuvenating skin treatments, and radiance-enhancing beauty care.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
        {
          '@type': 'Service',
          name: 'Doorstep Beauty Experiences',
          description:
            'Elevated in-home and venue beauty treatments delivered by master artisans at your doorstep in Hosur.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
      ],
    },
    {
      '@type': 'OfferCatalog',
      name: 'Fashion Services',
      itemListElement: [
        {
          '@type': 'Service',
          name: 'Custom Outfit Design & Couture',
          description:
            'Bespoke pattern making, silhouette styling, and handcrafted couture outfits designed from scratch.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
        {
          '@type': 'Service',
          name: 'Bridal & Occasion Wear Tailoring',
          description:
            'Custom bridal blouses, lehengas, evening gowns, and festive occasion ensembles.',
          provider: {
            '@id': `${BASE_URL}/#localbusiness`,
          },
          areaServed: 'Hosur',
        },
      ],
    },
  ],
})

/**
 * Fashion Catalog Schema for /fashion
 */
export const getFashionSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Bespoke Haute Fashion & Couture Design',
  serviceType: 'Custom Fashion Design and Tailoring',
  description:
    'Custom fashion design, bridal wear craftsmanship, couture tailoring, and personalized style consultations in Hosur.',
  provider: {
    '@id': `${BASE_URL}/#localbusiness`,
  },
  areaServed: {
    '@type': 'City',
    name: 'Hosur',
  },
  url: `${BASE_URL}/fashion`,
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Fashion Design Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Personal Fashion Consultation',
          description:
            'One-on-one consultation with fashion designers to understand your aesthetic, occasion, fabric preferences, and silhouette.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Pattern & Outfit Creation',
          description:
            'Bespoke garment construction with precision measurement taking, fabric selection, and artisan embellishments.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fitting & Finishing Sessions',
          description:
            'Dedicated chamber fitting sessions to guarantee an exact, comfortable, and flattering fit.',
        },
      },
    ],
  },
})

/**
 * ContactPage Schema for /contact
 */
export const getContactPageSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact WildFloral Beauty & Fashion Studio',
  description:
    'Contact WildFloral studio located at Neela Mega Nagar, Hosur for beauty appointments, fashion design consultations, and inquiries.',
  url: `${BASE_URL}/contact`,
  mainEntity: {
    '@id': `${BASE_URL}/#localbusiness`,
  },
})

/**
 * FAQPage Schema
 */
export const getFaqSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
})
