import {
  useEffect,
  useState,
} from 'react'
import type { FormEvent } from 'react'

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import './AdminLogin.css'

function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =======================================================
     CHECK EXISTING ADMIN SESSION
  ======================================================= */

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession()

      if (!session) {
        if (mounted) {
          setLoading(false)
        }

        return
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            session.user.id,
          )
          .maybeSingle()

      if (!mounted) {
        return
      }

      if (
        !profileError &&
        profile?.role === 'admin'
      ) {
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

    void checkSession()

    return () => {
      mounted = false
    }
  }, [navigate])

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const cleanEmail =
      email.trim()

    if (
      !cleanEmail ||
      !password
    ) {
      setError(
        'Please enter your email and password.',
      )

      return
    }

    setSubmitting(true)

    const {
      data,
      error: authError,
    } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

    if (
      authError ||
      !data.user
    ) {
      setError(
        'Invalid email or password.',
      )

      setSubmitting(false)

      return
    }

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from('profiles')
        .select('role')
        .eq(
          'id',
          data.user.id,
        )
        .maybeSingle()

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

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-loading">

          <div className="admin-login-loading-logo">
            WF
          </div>

          <span>
            Checking secure access...
          </span>

        </div>
      </main>
    )
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="admin-login-page">

      <section
        className="admin-login-container"
        aria-labelledby="admin-login-title"
      >

        {/* =================================================
            DECORATIVE LEFT SIDE
        ================================================= */}

        <div
          className="admin-login-decoration"
          aria-hidden="true"
        >
          <div className="admin-shape admin-shape-one" />
          <div className="admin-shape admin-shape-two" />
          <div className="admin-shape admin-shape-three" />
          <div className="admin-shape admin-shape-four" />
        </div>

        {/* =================================================
            LOGIN SIDE
        ================================================= */}

        <div className="admin-login-form-area">

          <div className="admin-login-inner">

            {/* BRAND */}

            <Link
              to="/"
              className="admin-login-brand"
              aria-label="WildFloral home"
            >
              <span className="admin-login-brand-name">
                WildFloral
              </span>

              <span className="admin-login-brand-subtitle">
                BEAUTY & FASHION STUDIO
              </span>
            </Link>

            {/* HEADING */}

            <div className="admin-login-heading">

              <span className="admin-login-eyebrow">
                STUDIO ADMINISTRATION
              </span>

              <h1 id="admin-login-title">
                Welcome
                <em>back.</em>
              </h1>

              <p>
                Sign in to manage your
                WildFloral studio.
              </p>

            </div>

            {/* FORM */}

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

              {/* EMAIL */}

              <div className="admin-login-field">

                <label htmlFor="admin-email">
                  Email Address
                </label>

                <div className="admin-login-input-wrap">

                  <Mail
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value,
                      )

                      setError('')
                    }}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={submitting}
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="admin-login-field">

                <div className="admin-login-label-row">

                  <label htmlFor="admin-password">
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="admin-forgot-link"
                  >
                    Forgot Password?
                  </Link>

                </div>

                <div className="admin-login-input-wrap">

                  <LockKeyhole
                    size={16}
                    strokeWidth={1.5}
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
                    onChange={(event) => {
                      setPassword(
                        event.target.value,
                      )

                      setError('')
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={submitting}
                    required
                  />

                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
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
                        size={17}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Eye
                        size={17}
                        strokeWidth={1.5}
                      />
                    )}
                  </button>

                </div>

              </div>

              {/* LOGIN */}

              <button
                type="submit"
                className="admin-login-submit"
                disabled={submitting}
              >

                <span>
                  {submitting
                    ? 'Signing In...'
                    : 'Login'}
                </span>

                {!submitting && (
                  <ArrowRight
                    size={18}
                    strokeWidth={1.6}
                  />
                )}

              </button>

            </form>

            {/* SECURITY */}

            <div className="admin-login-security">

              <span className="admin-security-dot" />

              <span>
                Secure administrator access
              </span>

            </div>

            {/* FOOTER */}

            <div className="admin-login-footer">

              <Link to="/">
                ← Back to WildFloral
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}

export default AdminLogin