import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import './AdminLogin.css'

function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function checkSession() {
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

      if (profile?.role === 'admin') {
        navigate('/admin', {
          replace: true,
        })

        return
      }

      await supabase.auth.signOut()

      setError(
        'This account does not have administrator access.',
      )

      setLoading(false)
    }

    checkSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (!email.trim() || !password) {
      setError(
        'Please enter your email and password.',
      )

      return
    }

    setSubmitting(true)

    const {
      data,
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError || !data.user) {
      setError(
        'Invalid email or password.',
      )

      setSubmitting(false)

      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (
      profileError ||
      profile?.role !== 'admin'
    ) {
      await supabase.auth.signOut()

      setError(
        'This account does not have administrator access.',
      )

      setSubmitting(false)

      return
    }

    navigate('/admin', {
      replace: true,
    })
  }

  if (loading) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-loading">
          <span className="admin-login-loading-mark">
            WF
          </span>

          <span>
            Checking secure access...
          </span>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-overlay" />

      <section
        className="admin-login-card"
        aria-labelledby="admin-login-title"
      >
        <div className="admin-login-brand">
          <Link
            to="/"
            className="admin-login-logo"
          >
            WildFloral
          </Link>

          <span>
            Studio Administration
          </span>
        </div>

        <div className="admin-login-heading">
          <span className="admin-login-eyebrow">
            Welcome back
          </span>

          <h1 id="admin-login-title">
          
            <em>Shalini.</em>
          </h1>

          <p>
            Sign in to manage your WildFloral
            studio, bookings, services, and
            portfolio.
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className="admin-login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="admin-login-field">
            <label htmlFor="admin-email">
              Email Address
            </label>

            <div className="admin-login-input-wrap">
              <Mail
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
              />

              <input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                placeholder="Enter your email"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-login-input-wrap">
              <LockKeyhole
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
              />

              <input
                id="admin-password"
                name="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={submitting}
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={submitting}
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    strokeWidth={1.6}
                  />
                ) : (
                  <Eye
                    size={18}
                    strokeWidth={1.6}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="admin-login-options">
            <span>
              Secure administrator access
            </span>

            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="admin-login-submit"
            disabled={submitting}
          >
            <span>
              {submitting
                ? 'Signing In...'
                : 'Sign In'}
            </span>

            {!submitting && (
              <ArrowRight
                size={20}
                strokeWidth={1.5}
              />
            )}
          </button>
        </form>

        <div className="admin-login-security">
          <span className="admin-security-dot" />

          Protected WildFloral administration
        </div>

        <div className="admin-login-footer">
          <Link to="/">
            ← Back to WildFloral
          </Link>
        </div>
      </section>
    </main>
  )
}

export default AdminLogin