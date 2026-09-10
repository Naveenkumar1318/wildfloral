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
  UserRound,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../../../lib/supabase'

import './CustomerRegister.css'

function CustomerRegister() {
  const navigate = useNavigate()
  const [searchParams] =
    useSearchParams()

  const redirect =
    searchParams.get('redirect') ||
    '/account'

  const [fullName, setFullName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false)

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  /* =========================================================
     URL ERROR
  ========================================================= */

  useEffect(() => {
    const urlError =
      searchParams.get('error')

    setError('')
    setSuccess('')

    switch (urlError) {
      case 'account_not_found':
        setError(
          'No customer account found. Please create your account first.',
        )
        break

      case 'account_exists':
        setError(
          'You already have an account. Please sign in instead.',
        )
        break

      case 'admin_account':
        setError(
          'This is an admin account. Please use the admin login.',
        )
        break

      case 'registration_failed':
        setError(
          'Unable to create your account. Please try again.',
        )
        break

      case 'profile_check_failed':
        setError(
          'Unable to verify your customer account. Please try again.',
        )
        break

      case 'invalid_customer_account':
        setError(
          'This account cannot be registered as a customer.',
        )
        break

      default:
        break
    }
  }, [searchParams])

  /* =========================================================
     CHECK CURRENT SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true

    async function checkSession() {
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
            'Registration session error:',
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
            .select('id, role')
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
            'Registration profile error:',
            profileError,
          )

          return
        }

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

        if (
          profile?.role ===
          'admin'
        ) {
          await supabase.auth.signOut()

          if (!mounted) {
            return
          }

          setError(
            'This is an admin account. Please use the admin login.',
          )
        }
      } catch (error) {
        console.error(
          'Registration session check failed:',
          error,
        )
      }
    }

    void checkSession()

    return () => {
      mounted = false
    }
  }, [
    navigate,
    redirect,
  ])

  /* =========================================================
     MANUAL REGISTRATION
  ========================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const cleanName =
      fullName.trim()

    const cleanEmail =
      email.trim().toLowerCase()

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setError(
        'Please complete all required fields.',
      )

      return
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.',
      )

      return
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'Passwords do not match.',
      )

      return
    }

    setLoading(true)

    try {
      /* =====================================================
         CREATE AUTH USER
      ===================================================== */

      const {
        data,
        error: signUpError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,

          options: {
            data: {
              full_name:
                cleanName,

              registration_method:
                'customer_email',
            },

            /*
             * After email confirmation, return
             * to the application.
             */
            emailRedirectTo:
              `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
                redirect,
              )}&auth_mode=login`,
          },
        })

      /* =====================================================
         SIGNUP ERROR
      ===================================================== */

      if (signUpError) {
        console.error(
          'Customer signup error:',
          signUpError,
        )

        const message =
          signUpError.message.toLowerCase()

        const duplicate =
          message.includes(
            'already registered',
          ) ||
          message.includes(
            'already exists',
          ) ||
          message.includes(
            'user already registered',
          ) ||
          message.includes(
            'already been registered',
          )

        if (duplicate) {
          navigate(
            `/login?redirect=${encodeURIComponent(
              redirect,
            )}&error=account_exists`,
            {
              replace: true,
            },
          )

          return
        }

        setError(
          signUpError.message ||
            'Unable to create your account.',
        )

        return
      }

      /* =====================================================
         SAFETY CHECK
      ===================================================== */

      if (!data.user) {
        setError(
          'Account could not be created. Please try again.',
        )

        return
      }

      /*
       * IMPORTANT:
       *
       * We DO NOT insert into profiles here.
       *
       * The database trigger creates the profile
       * for email/password registrations.
       */

      /* =====================================================
         EXISTING ACCOUNT PROTECTION
      ===================================================== */

      const identities =
        data.user.identities ?? []

      if (
        identities.length === 0
      ) {
        navigate(
          `/login?redirect=${encodeURIComponent(
            redirect,
          )}&error=account_exists`,
          {
            replace: true,
          },
        )

        return
      }

      /* =====================================================
         EMAIL CONFIRMATION ENABLED
      ===================================================== */

      if (!data.session) {
        setSuccess(
          'Account created successfully. Please check your email to confirm your account, then sign in.',
        )

        setFullName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')

        return
      }

      /* =====================================================
         EMAIL CONFIRMATION DISABLED
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
          'Customer profile verification error:',
          profileError,
        )

        await supabase.auth.signOut()

        setError(
          'Your account was created, but the customer profile could not be verified.',
        )

        return
      }

      if (
        !profile ||
        profile.role !==
          'customer'
      ) {
        await supabase.auth.signOut()

        setError(
          'Customer account setup could not be completed.',
        )

        return
      }

      navigate(
        redirect,
        {
          replace: true,
        },
      )
    } catch (error) {
      console.error(
        'Customer registration failed:',
        error,
      )

      setError(
        'Unable to create your account. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     GOOGLE REGISTRATION
  ========================================================= */

  async function handleGoogleRegister() {
    setError('')
    setSuccess('')
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
       * IMPORTANT:
       *
       * This is CUSTOMER REGISTRATION.
       *
       * AuthCallback will create the profile
       * after Google authentication succeeds.
       */
      callbackUrl.searchParams.set(
        'auth_mode',
        'register',
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
          'Google registration error:',
          googleError,
        )

        setError(
          googleError.message ||
            'Google registration is unavailable.',
        )

        setGoogleLoading(false)
      }
    } catch (error) {
      console.error(
        'Google registration exception:',
        error,
      )

      setError(
        'Unable to continue with Google.',
      )

      setGoogleLoading(false)
    }
  }

  return (
    <main className="customer-register-page">

      {/* =====================================================
          LEFT CONTENT
      ===================================================== */}

      <section className="customer-register-intro">

        <div className="customer-register-shape register-shape-one" />

        <div className="customer-register-shape register-shape-two" />

        <div className="customer-register-shape register-shape-three" />

        <Link
          to="/"
          className="customer-register-brand"
        >
          WildFloral
        </Link>

        <div className="customer-register-intro-content">

          <span>
            WELCOME TO WILDFLORAL
          </span>

          <h1>
            Beauty and fashion,
            <br />
            made <em>personal.</em>
          </h1>

          <p>
            Create your account to manage
            appointments, discover services,
            and keep your WildFloral experience
            together.
          </p>

          <div className="customer-register-features">

            <div>
              <span>
                01
              </span>

              <p>
                Manage your appointments
              </p>
            </div>

            <div>
              <span>
                02
              </span>

              <p>
                Discover beauty services
              </p>
            </div>

            <div>
              <span>
                03
              </span>

              <p>
                Explore custom fashion
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          REGISTER FORM
      ===================================================== */}

      <section className="customer-register-form-area">

        <div className="customer-register-mobile-brand">

          <Link to="/">
            WildFloral
          </Link>

        </div>

        <div className="customer-register-container">

          <div className="customer-register-heading">

            <span>
              CREATE ACCOUNT
            </span>

            <h2>
              Begin your
              <em>experience.</em>
            </h2>

            <p>
              Create your WildFloral account
              using your email address.
            </p>

          </div>

          {error && (
            <div
              className="customer-register-error"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="customer-register-success"
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          )}

          {/* GOOGLE */}

          <button
            type="button"
            className="customer-register-google"
            onClick={
              handleGoogleRegister
            }
            disabled={
              loading ||
              googleLoading
            }
          >
            <span>
              G
            </span>

            {googleLoading
              ? 'Connecting...'
              : 'Continue with Google'}
          </button>

          <div className="customer-register-divider">

            <span />

            <small>
              OR
            </small>

            <span />

          </div>

          {/* FORM */}

          <form
            className="customer-register-form"
            onSubmit={
              handleSubmit
            }
          >

            {/* NAME */}

            <div className="customer-register-field">

              <label htmlFor="register-name">
                Full name
              </label>

              <div className="customer-register-input">

                <UserRound
                  size={17}
                  strokeWidth={1.6}
                />

                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value,
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="customer-register-field">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="customer-register-input">

                <Mail
                  size={17}
                  strokeWidth={1.6}
                />

                <input
                  id="register-email"
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

            <div className="customer-register-field">

              <label htmlFor="register-password">
                Password
              </label>

              <div className="customer-register-input">

                <LockKeyhole
                  size={17}
                  strokeWidth={1.6}
                />

                <input
                  id="register-password"
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
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  required
                />

                <button
                  type="button"
                  className="customer-register-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  disabled={
                    loading ||
                    googleLoading
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={17}
                    />
                  ) : (
                    <Eye
                      size={17}
                    />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="customer-register-field">

              <label htmlFor="register-confirm-password">
                Confirm password
              </label>

              <div className="customer-register-input">

                <LockKeyhole
                  size={17}
                  strokeWidth={1.6}
                />

                <input
                  id="register-confirm-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={
                    loading ||
                    googleLoading
                  }
                  required
                />

                <button
                  type="button"
                  className="customer-register-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  disabled={
                    loading ||
                    googleLoading
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={17}
                    />
                  ) : (
                    <Eye
                      size={17}
                    />
                  )}
                </button>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="customer-register-submit"
              disabled={
                loading ||
                googleLoading
              }
            >
              <span>
                {loading
                  ? 'Creating account...'
                  : 'Create account'}
              </span>

              {!loading && (
                <ArrowRight
                  size={18}
                  strokeWidth={1.6}
                />
              )}
            </button>

          </form>

          {/* SECURITY */}

          <div className="customer-register-security">

            <ShieldCheck
              size={15}
              strokeWidth={1.6}
            />

            <span>
              Your account is securely protected
            </span>

          </div>

          {/* LOGIN */}

          <div className="customer-register-login">

            <span>
              Already have an account?
            </span>

            <Link
              to={`/login?redirect=${encodeURIComponent(
                redirect,
              )}`}
            >
              Sign in
            </Link>

          </div>

        </div>

      </section>

    </main>
  )
}

export default CustomerRegister