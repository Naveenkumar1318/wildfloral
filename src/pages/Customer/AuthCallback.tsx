import { useEffect } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router'

import { supabase } from '../../lib/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const location =
    useLocation()

  useEffect(() => {
    let mounted = true

    async function handleCallback() {
      const params =
        new URLSearchParams(
          location.search,
        )

      const redirect =
        params.get('redirect') ||
        '/account'

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (!session) {
        navigate(
          `/login?redirect=${encodeURIComponent(
            redirect,
          )}`,
          {
            replace: true,
          },
        )

        return
      }

      navigate(
        redirect,
        {
          replace: true,
        },
      )
    }

    void handleCallback()

    return () => {
      mounted = false
    }
  }, [
    location.search,
    navigate,
  ])

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <p>
        Completing secure sign in...
      </p>
    </main>
  )
}

export default AuthCallback