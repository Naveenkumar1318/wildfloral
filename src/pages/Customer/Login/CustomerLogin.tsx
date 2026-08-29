import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router'

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../../../lib/supabase'

import './CustomerLogin.css'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const redirect =
    searchParams.get('redirect') || '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        navigate(redirect, {
          replace: true,
        })
      }
    }

    checkExistingSession()
  }, [navigate, redirect])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setError(
        'Please enter your email and password.',
      )

      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

      if (authError || !data.user) {
        setError(
          'Invalid email or password.',
        )

        return
      }

      navigate(redirect, {
        replace: true,
      })
    } catch {
      setError(
        'Unable to sign in. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)

    try {
      const callbackUrl = new URL(
        '/auth/callback',
        window.location.origin,
      )

      callbackUrl.searchParams.set(
        'redirect',
        redirect,
      )

      const {
        error: googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              callbackUrl.toString(),

            queryParams: {
              prompt: 'select_account',
            },
          },
        })

      if (googleError) {
        setError(
          googleError.message ||
            'Google sign in is unavailable.',
        )

        setGoogleLoading(false)
      }
    } catch {
      setError(
        'Unable to continue with Google.',
      )

      setGoogleLoading(false)
    }
  }

  return (
    <main className="customer-auth-page">

      {/* =====================================================
          LEFT VISUAL
      ===================================================== */}

      <section className="customer-auth-visual">

        <div className="customer-auth-shape customer-auth-shape-one" />
        <div className="customer-auth-shape customer-auth-shape-two" />
        <div className="customer-auth-shape customer-auth-shape-three" />

        <Link
          to="/"
          className="customer-auth-visual-brand"
        >
          WildFloral
        </Link>

        <div className="customer-auth-visual-content">

          <span>
            BEAUTY · FASHION · YOU
          </span>

          <h1>
            Your style,
            <br />
            your <em>experience.</em>
          </h1>

          <p>
            Discover personalized beauty and
            fashion services created around you.
          </p>

        </div>

        <div className="customer-auth-visual-footer">
          <span />
          <small>
            WILDFLORAL STUDIO
          </small>
        </div>

      </section>

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <section className="customer-auth-form-area">

        <div className="customer-auth-mobile-brand">
          <Link to="/">
            WildFloral
          </Link>
        </div>

        <div className="customer-auth-form-container">

          <div className="customer-auth-heading">

            <span className="customer-auth-eyebrow">
              WELCOME BACK
            </span>

            <h2>
              Sign in to your
              <em>account.</em>
            </h2>

            <p>
              Continue your WildFloral experience
              with your email and password.
            </p>

          </div>

          {/* GOOGLE */}

          <button
            type="button"
            className="customer-google-button"
            onClick={handleGoogleLogin}
            disabled={
              loading ||
              googleLoading
            }
          >
            <span className="customer-google-icon">
              G
            </span>

            <span>
              {googleLoading
                ? 'Connecting...'
                : 'Continue with Google'}
            </span>
          </button>

          {/* DIVIDER */}

          <div className="customer-auth-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          {/* FORM */}

          <form
            className="customer-auth-form"
            onSubmit={handleSubmit}
          >

            {error && (
              <div
                className="customer-auth-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* EMAIL */}

            <div className="customer-auth-field">

              <label htmlFor="customer-email">
                Email address
              </label>

              <div className="customer-auth-input-wrap">

                <Mail
                  size={18}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />

                <input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="customer-auth-field">

              <div className="customer-auth-label-row">

                <label htmlFor="customer-password">
                  Password
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>

              </div>

              <div className="customer-auth-input-wrap">

                <LockKeyhole
                  size={18}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />

                <input
                  id="customer-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  required
                />

                <button
                  type="button"
                  className="customer-password-toggle"
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
                  disabled={
                    loading ||
                    googleLoading
                  }
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

            {/* SUBMIT */}

            <button
              type="submit"
              className="customer-auth-submit"
              disabled={
                loading ||
                googleLoading
              }
            >
              <span>
                {loading
                  ? 'Signing in...'
                  : 'Sign in'}
              </span>

              {!loading && (
                <ArrowRight
                  size={19}
                  strokeWidth={1.6}
                />
              )}
            </button>

          </form>

          {/* SECURITY */}

          <div className="customer-auth-security">
            <ShieldCheck
              size={15}
              strokeWidth={1.6}
            />

            <span>
              Secure customer authentication
            </span>
          </div>

          {/* REGISTER */}

          <div className="customer-auth-switch">
            <span>
              Don't have an account?
            </span>

            <Link
              to={`/register?redirect=${encodeURIComponent(
                redirect,
              )}`}
            >
              Create an account
            </Link>
          </div>

        </div>

      </section>

    </main>
  )
}

export default Login