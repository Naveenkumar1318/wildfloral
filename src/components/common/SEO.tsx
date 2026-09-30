import React, { useEffect } from 'react'

export interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  ogType?: 'website' | 'article' | 'profile'
  ogImage?: string
  noIndex?: boolean
  schemas?: Record<string, unknown>[]
}

const DEFAULT_TITLE = 'WildFloral | Beauty & Fashion Studio in Hosur'
const DEFAULT_DESCRIPTION =
  'WildFloral is a luxury beauty and fashion studio in Hosur — bridal makeup, couture, custom outfit design and personalized consultations. Book your appointment.'
const DEFAULT_CANONICAL = 'https://www.wildfloral.online/'
const DEFAULT_IMAGE = 'https://www.wildfloral.online/logo.png'
const SITE_NAME = 'WildFloral'

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonical = DEFAULT_CANONICAL,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  noIndex = false,
  schemas = [],
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title

    // Helper to create or update meta tags
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attributeName, attributeValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Helper to create or update link tags
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
      if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', rel)
        document.head.appendChild(element)
      }
      element.setAttribute('href', href)
    }

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description)
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    // 3. Canonical Link (ensure www & HTTPS)
    const normalizedCanonical = canonical.startsWith('https://www.wildfloral.online')
      ? canonical
      : canonical.replace('https://wildfloral.online', 'https://www.wildfloral.online')
    setLinkTag('canonical', normalizedCanonical)

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:url', normalizedCanonical)
    setMetaTag('property', 'og:type', ogType)
    setMetaTag('property', 'og:site_name', SITE_NAME)
    setMetaTag('property', 'og:locale', 'en_IN')
    setMetaTag('property', 'og:image', ogImage)

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', ogImage)

    // 6. JSON-LD Schemas injection
    const injectedScriptElements: HTMLScriptElement[] = []
    if (schemas && schemas.length > 0) {
      schemas.forEach((schemaData, index) => {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-wf-schema-id', `wf-schema-${index}`)
        script.textContent = JSON.stringify(schemaData)
        document.head.appendChild(script)
        injectedScriptElements.push(script)
      })
    }

    return () => {
      // Cleanup dynamically injected schema scripts when navigating away
      injectedScriptElements.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })
    }
  }, [title, description, canonical, ogType, ogImage, noIndex, schemas])

  return null
}
