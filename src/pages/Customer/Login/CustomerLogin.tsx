import {
  useEffect,
  useState,
} from 'react'
import type { FormEvent } from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

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

function CustomerLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const redirect =
    searchParams.get('redirect') || '/account'

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =========================================================
     URL ERROR
  ========================================================= */

  useEffect(() => {
    const urlError =
      searchParams.get('error')

    setError('')

    switch (urlError) {
      case 'account_not_found':
        setError(
          'No customer account found. Please create your account first.',
        )
        break

      case 'account_exists':
        setError(
          'You already have an account. Please sign in.',
        )
        break

      case 'admin_account':
        setError(
          'This is an admin account. Please use the admin login.',
        )
        break

      case 'invalid_customer_account':
        setError(
          'This account cannot use customer login.',
        )
        break

      case 'authentication_failed':
        setError(
          'Authentication failed. Please try again.',
        )
        break

      case 'profile_check_failed':
        setError(
          'Unable to verify your customer account. Please try again.',
        )
        break

      default:
        break
    }
  }, [searchParams])

  /* =========================================================
     CHECK EXISTING SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true

    async function checkExistingSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (sessionError) {
          console.error(
            'Existing session error:',
            sessionError,
          )

          return
        }

        if (!session?.user) {
          return
        }

        const {
          data: profile,
          error: profileError,
        } =
          await supabase
            .from('profiles')
            .select(
              'id, email, full_name, role',
            )
            .eq(
              'id',
              session.user.id,
            )
            .maybeSingle()

        if (!mounted) {
          return
        }

        if (profileError) {
          console.error(
            'Existing session profile error:',
            profileError,
          )

          await supabase.auth.signOut()

          setError(
            'Unable to verify your customer account.',
          )

          return
        }

        /* CUSTOMER */

        if (
          profile?.role ===
          'customer'
        ) {
          navigate(
            redirect,
            {
              replace: true,
            },
          )

          return
        }

        /* ADMIN */

        if (
          profile?.role ===
          'admin'
        ) {
          await supabase.auth.signOut()

          setError(
            'This is an admin account. Please use the admin login.',
          )

          return
        }

        /*
         * Auth user exists but customer profile
         * does not exist.
         *
         * DO NOT create profile during login.
         */

        await supabase.auth.signOut()

        setError(
          'No customer account found. Please create your account first.',
        )
      } catch (error) {
        console.error(
          'Existing session check failed:',
          error,
        )
      }
    }

    void checkExistingSession()

    return () => {
      mounted = false
    }
  }, [
    navigate,
    redirect,
  ])

  /* =========================================================
     EMAIL / PASSWORD LOGIN
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const cleanEmail =
      email.trim().toLowerCase()

    if (
      !cleanEmail ||
      !password
    ) {
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

      /* =====================================================
         AUTHENTICATION FAILED
      ===================================================== */

      if (
        authError ||
        !data.user
      ) {
        if (
          authError?.message
            ?.toLowerCase()
            .includes('email not confirmed')
        ) {
          setError(
            'Please confirm your email address before signing in.',
          )
        } else {
          setError(
            'Invalid email or password.',
          )
        }

        return
      }

      /* =====================================================
         CHECK CUSTOMER PROFILE
      ===================================================== */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .select(
            'id, email, full_name, role',
          )
          .eq(
            'id',
            data.user.id,
          )
          .maybeSingle()

      if (profileError) {
        console.error(
          'Customer profile lookup failed:',
          profileError,
        )

        await supabase.auth.signOut()

        setError(
          'Unable to verify your customer account. Please try again.',
        )

        return
      }

      /*
       * IMPORTANT:
       *
       * Login NEVER creates a profile.
       */

      if (!profile) {
        await supabase.auth.signOut()

        setError(
          'No customer account found. Please create your account first.',
        )

        return
      }

      /* ADMIN */

      if (
        profile.role ===
        'admin'
      ) {
        await supabase.auth.signOut()

        setError(
          'This is an admin account. Please use the admin login.',
        )

        return
      }

      /* INVALID ROLE */

      if (
        profile.role !==
        'customer'
      ) {
        await supabase.auth.signOut()

        setError(
          'This account cannot use customer login.',
        )

        return
      }

      /* =====================================================
         SUCCESS
      ===================================================== */

      navigate(
        redirect,
        {
          replace: true,
        },
      )
    } catch (error) {
      console.error(
        'Customer login error:',
        error,
      )

      await supabase.auth.signOut()

      setError(
        'Unable to sign in. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)

    try {
      const callbackUrl =
        new URL(
          '/auth/callback',
          window.location.origin,
        )

      callbackUrl.searchParams.set(
        'redirect',
        redirect,
      )

      /*
       * CUSTOMER LOGIN
       */
      callbackUrl.searchParams.set(
        'auth_mode',
        'login',
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
              prompt:
                'select_account',
            },
          },
        })

      if (googleError) {
        console.error(
          'Google login error:',
          googleError,
        )

        setError(
          googleError.message ||
            'Google sign in is unavailable.',
        )

        setGoogleLoading(false)
      }
    } catch (error) {
      console.error(
        'Google login error:',
        error,
      )

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
          LOGIN FORM
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
            onClick={
              handleGoogleLogin
            }
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

          <div className="customer-auth-divider">

            <span />

            <small>
              OR
            </small>

            <span />

          </div>

          {/* FORM */}

          <form
            className="customer-auth-form"
            onSubmit={
              handleSubmit
            }
          >

            {error && (
              <div
                className="customer-auth-error"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* EMAIL */}

            <div className="customer-auth-field">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="customer-auth-input">

                <Mail
                  size={18}
                  strokeWidth={1.6}
                />

                <input
                  id="login-email"
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

                <label htmlFor="login-password">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                >
                  Forgot password?
                </Link>

              </div>

              <div className="customer-auth-input">

                <LockKeyhole
                  size={18}
                  strokeWidth={1.6}
                />

                <input
                  id="login-password"
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

export default CustomerLogin