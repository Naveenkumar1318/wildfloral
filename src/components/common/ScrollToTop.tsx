import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const {
    pathname,
    search,
    hash,
  } = useLocation()

  useEffect(() => {
    // Do not override intentional anchor navigation.
    if (hash) {
      return
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [pathname, search, hash])

  return null
}

export default ScrollToTop