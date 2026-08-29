import {
  Navigate,
  useLocation,
} from 'react-router'

import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../../lib/supabase'

type CustomerProtectedRouteProps = {
  children: React.ReactNode
}

function CustomerProtectedRoute({
  children,
}: CustomerProtectedRouteProps) {
  const location = useLocation()

  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] =
    useState(false)

  useEffect(() => {
    let mounted = true

    async function checkCustomerSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setAuthenticated(Boolean(session))
      setLoading(false)
    }

    void checkCustomerSession()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <p>
          Checking your account...
        </p>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <>{children}</>
}

export default CustomerProtectedRoute