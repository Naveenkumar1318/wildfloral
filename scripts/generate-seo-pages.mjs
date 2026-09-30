import fs from 'node:fs'
import path from 'node:path'

const distPath = path.resolve('dist')
const indexPath = path.join(distPath, 'index.html')

const baseHtml = fs.readFileSync(indexPath, 'utf8')

const pages = [
  {
    path: 'about',
    title: 'About WildFloral | Beauty & Fashion Studio in Hosur',
    description:
      'Discover WildFloral, a luxury beauty and fashion studio in Hosur offering personalized beauty care, bridal services, fashion design and consultations.',
  },
  {
    path: 'services',
    title: 'Beauty & Fashion Services | WildFloral Hosur',
    description:
      'Explore WildFloral beauty and fashion services in Hosur, including bridal makeup, hair styling, skincare and personalized fashion design.',
  },
  {
    path: 'fashion',
    title: 'Fashion Design & Couture | WildFloral Hosur',
    description:
      'Explore custom fashion design and couture services at WildFloral in Hosur, created around your measurements, occasion and personal style.',
  },
  {
    path: 'booking',
    title: 'Book Beauty Appointment | WildFloral Hosur',
    description:
      'Book a beauty appointment at WildFloral in Hosur. Choose your service, professional, date and available appointment slot.',
  },
  {
    path: 'fashion-booking',
    title: 'Book Fashion Consultation | WildFloral Hosur',
    description:
      'Book a personalized fashion consultation with WildFloral in Hosur for custom outfits, couture and fashion design.',
  },
  {
    path: 'contact',
    title: 'Contact WildFloral | Beauty & Fashion Studio in Hosur',
    description:
      'Contact WildFloral Beauty & Fashion Studio in Hosur for appointments, consultations and service enquiries.',
  },
  {
    path: 'enquiry',
    title: 'Enquiry | WildFloral Beauty & Fashion Studio',
    description:
      'Send an enquiry to WildFloral for beauty services, fashion design, consultations and appointments in Hosur.',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy | WildFloral',
    description:
      'Read the WildFloral privacy policy covering website usage, customer information and privacy practices.',
  },
  {
    path: 'terms',
    title: 'Terms & Conditions | WildFloral',
    description:
      'Read the terms and conditions governing use of the WildFloral website, services and bookings.',
  },
]

function createPageHtml(page) {
  const canonical = `https://www.wildfloral.online/${page.path}`

  return baseHtml
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${page.title}</title>`,
    )
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${page.description}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonical}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${page.title}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${page.description}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonical}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${page.title}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${page.description}" />`,
    )
}

for (const page of pages) {
  const pageDirectory = path.join(distPath, page.path)
  const pageIndexPath = path.join(pageDirectory, 'index.html')

  fs.mkdirSync(pageDirectory, { recursive: true })
  fs.writeFileSync(pageIndexPath, createPageHtml(page), 'utf8')

  console.log(`Generated /${page.path}/index.html`)
}