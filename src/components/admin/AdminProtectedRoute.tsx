import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { supabase } from '../../lib/supabase'

type AdminProtectedRouteProps = {
  children: React.ReactNode
}

function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const location = useLocation()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        if (mounted) {
          setLoading(false)
        }

        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!mounted) return

      setIsAdmin(profile?.role === 'admin')
      setLoading(false)
    }

    checkAdminAccess()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-loading">
          Verifying access...
        </div>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return children
}

export default AdminProtectedRoute