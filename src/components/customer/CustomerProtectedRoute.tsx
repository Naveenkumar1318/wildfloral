import {
  Navigate,
  useLocation,
} from 'react-router-dom'

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
  const [customer, setCustomer] = useState(false)
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkCustomerSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (
          sessionError ||
          !session?.user
        ) {
          setCustomer(false)
          setAdmin(false)
          setLoading(false)

          return
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!mounted) {
          return
        }

        if (profileError) {
          console.error(
            'Customer route profile error:',
            profileError,
          )

          setCustomer(false)
          setAdmin(false)
          setLoading(false)

          return
        }

        if (profile?.role === 'customer') {
          setCustomer(true)
          setAdmin(false)
        } else if (
          profile?.role === 'admin'
        ) {
          setCustomer(false)
          setAdmin(true)
        } else {
          setCustomer(false)
          setAdmin(false)
        }

        setLoading(false)
      } catch (error) {
        console.error(
          'Customer route error:',
          error,
        )

        if (!mounted) {
          return
        }

        setCustomer(false)
        setAdmin(false)
        setLoading(false)
      }
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

  /*
   * Admin must never enter customer application.
   */
  if (admin) {
  return (
    <Navigate
      to="/login"
      replace
      state={{
        from: location.pathname,
        message:
          'Admin accounts cannot access the customer dashboard.',
      }}
    />
  )
}

  /*
   * No valid customer account.
   */
  if (!customer) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message:
            'Please sign in with a customer account.',
        }}
      />
    )
  }

  return <>{children}</>
}

export default CustomerProtectedRoute