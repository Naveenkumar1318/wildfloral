import {
  FormEvent,
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
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../../../lib/supabase'

import './CustomerRegister.css'

function Register() {
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

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMessage('')

    const name =
      fullName.trim()

    const cleanEmail =
      email.trim()

    if (!name) {
      setError(
        'Please enter your full name.',
      )

      return
    }

    if (!cleanEmail) {
      setError(
        'Please enter your email address.',
      )

      return
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.',
      )

      return
    }

    if (password !== confirmPassword) {
      setError(
        'Passwords do not match.',
      )

      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: signUpError,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,

          options: {
            data: {
              full_name: name,
            },
          },
        })

      if (signUpError) {
        const normalized =
          signUpError.message.toLowerCase()

        if (
          normalized.includes(
            'already registered',
          ) ||
          normalized.includes(
            'already exists',
          )
        ) {
          setError(
            'An account with this email already exists. Please sign in.',
          )

          return
        }

        setError(
          signUpError.message ||
            'Unable to create your account.',
        )

        return
      }

      if (data.session) {
        navigate(redirect, {
          replace: true,
        })

        return
      }

      setMessage(
        'Account created. Please check your email to confirm your account.',
      )

      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch {
      setError(
        'Unable to create your account. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
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
        setError(
          googleError.message ||
            'Google registration is unavailable.',
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
              <span>01</span>

              <p>
                Manage your appointments
              </p>
            </div>

            <div>
              <span>02</span>

              <p>
                Discover beauty services
              </p>
            </div>

            <div>
              <span>03</span>

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
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="customer-register-success"
              role="status"
            >
              {message}
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
            <small>OR</small>
            <span />
          </div>

          {/* FORM */}

          <form
            className="customer-register-form"
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            <div className="customer-register-field">

              <label htmlFor="register-name">
                Full name
              </label>

              <div className="customer-register-input">

                <User
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
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
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
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
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

export default Register