import {
  FormEvent,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router'

import { supabase } from '../../lib/supabase'

import './Register.css'

type RegisterMode =
  | 'email'
  | 'phone'

function isEmail(
  value: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  )
}

function normalizePhone(
  value: string,
) {
  const cleaned =
    value.replace(
      /[^\d+]/g,
      '',
    )

  if (
    cleaned.startsWith('91') &&
    !cleaned.startsWith('+')
  ) {
    return `+${cleaned}`
  }

  if (
    cleaned.length === 10 &&
    !cleaned.startsWith('+')
  ) {
    return `+91${cleaned}`
  }

  return cleaned
}

function getSafeRedirect(
  value: string | null,
) {
  if (!value) {
    return '/booking'
  }

  try {
    const decoded =
      decodeURIComponent(value)

    if (
      decoded.startsWith('/')
    ) {
      return decoded
    }
  } catch {
    return '/booking'
  }

  return '/booking'
}

function GoogleIcon() {
  return (
    <svg
      className="register-google-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M21.35 12.23c0-.78-.07-1.54-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.42Z"
        fill="#4285F4"
      />

      <path
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.5Z"
        fill="#34A853"
      />

      <path
        d="M6.53 13.59a5.86 5.86 0 0 1 0-3.18V7.88H3.29a9.74 9.74 0 0 0 0 8.24l3.24 2.53Z"
        fill="#FBBC05"
      />

      <path
        d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.46 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.71 5.38l3.24 2.53C7.3 8.1 9.46 6.38 12 6.38Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Register() {
  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const redirect =
    getSafeRedirect(
      searchParams.get(
        'redirect',
      ),
    )

  const [mode, setMode] =
    useState<RegisterMode>(
      'email',
    )

  const [fullName, setFullName] =
    useState('')

  const [identifier, setIdentifier] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  function switchMode(
    nextMode: RegisterMode,
  ) {
    setMode(nextMode)

    setIdentifier('')

    setError('')
    setMessage('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMessage('')

    const name =
      fullName.trim()

    const value =
      identifier.trim()

    if (!name) {
      setError(
        'Enter your full name.',
      )

      return
    }

    if (!value) {
      setError(
        mode === 'email'
          ? 'Enter your email address.'
          : 'Enter your mobile number.',
      )

      return
    }

    if (
      mode === 'email' &&
      !isEmail(value)
    ) {
      setError(
        'Enter a valid email address.',
      )

      return
    }

    const phone =
      normalizePhone(value)

    if (
      mode === 'phone' &&
      !/^\+[1-9]\d{7,14}$/.test(
        phone,
      )
    ) {
      setError(
        'Use your country code, for example +919876543210.',
      )

      return
    }

    setLoading(true)

    try {
      const metadata = {
        full_name: name,

        phone:
          mode === 'phone'
            ? phone
            : '',
      }

      const result =
        mode === 'email'
          ? await supabase.auth.signInWithOtp(
              {
                email: value,

                options: {
                  shouldCreateUser:
                    true,

                  data: metadata,
                },
              },
            )
          : await supabase.auth.signInWithOtp(
              {
                phone,

                options: {
                  shouldCreateUser:
                    true,

                  data: metadata,
                },
              },
            )

      if (result.error) {
        const text =
          result.error.message.toLowerCase()

        if (
          text.includes(
            'rate limit',
          ) ||
          text.includes(
            'too many',
          ) ||
          text.includes('429')
        ) {
          setError(
            'Too many requests. Please wait before trying again.',
          )

          return
        }

        setError(
          getFriendlyAuthError(
            result.error.message,
          ),
        )

        return
      }

      sessionStorage.setItem(
        'wildfloral_register_name',
        name,
      )

      sessionStorage.setItem(
        'wildfloral_register_identifier',
        mode === 'email'
          ? value
          : phone,
      )

      sessionStorage.setItem(
        'wildfloral_register_mode',
        mode,
      )

      setMessage(
        'Verification code sent. Redirecting...',
      )

      navigate(
        `/login?redirect=${encodeURIComponent(
          redirect,
        )}&verify=1`,
        {
          replace: true,
        },
      )
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

      const result =
        await supabase.auth.signInWithOAuth(
          {
            provider: 'google',

            options: {
              redirectTo:
                callbackUrl.toString(),

              queryParams: {
                prompt:
                  'select_account',
              },
            },
          },
        )

      if (result.error) {
        setError(
          getFriendlyAuthError(
            result.error.message,
          ),
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
    <main className="register-page">
      <section className="register-intro">
        <Link
          to="/"
          className="register-brand"
        >
          WildFloral
        </Link>

        <div className="register-intro-content">
          <span className="register-intro-eyebrow">
            WELCOME TO WILDFLORAL
          </span>

          <h1>
            Your style,
            <span>
              your experience.
            </span>
          </h1>

          <p>
            Create your account and keep
            your appointments, services
            and preferences together.
          </p>

          <div className="register-feature-list">
            <div>
              <span>01</span>

              <p>
                Save your favourite services
              </p>
            </div>

            <div>
              <span>02</span>

              <p>
                Manage your appointments
              </p>
            </div>

            <div>
              <span>03</span>

              <p>
                Sign in without a password
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="register-form-area">
        <div className="register-form-header">
          <span>
            CREATE ACCOUNT
          </span>

          <h2>
            Begin your
            <em>
              experience.
            </em>
          </h2>

          <p>
            Create your account with your
            email or mobile number.
          </p>
        </div>

        {error && (
          <div
            className="register-message register-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="register-message register-message-success"
            role="status"
          >
            {message}
          </div>
        )}

        <div className="register-method-switch">
          <button
            type="button"
            className={
              mode === 'email'
                ? 'active'
                : ''
            }
            onClick={() =>
              switchMode('email')
            }
          >
            Email
          </button>

          <button
            type="button"
            className={
              mode === 'phone'
                ? 'active'
                : ''
            }
            onClick={() =>
              switchMode('phone')
            }
          >
            Mobile
          </button>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="register-field">
            <label htmlFor="register-name">
              Full name
            </label>

            <input
              id="register-name"
              className="register-input"
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
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-identifier">
              {mode === 'email'
                ? 'Email address'
                : 'Mobile number'}
            </label>

            <input
              id="register-identifier"
              className="register-input"
              type={
                mode === 'email'
                  ? 'email'
                  : 'tel'
              }
              value={identifier}
              onChange={(event) =>
                setIdentifier(
                  event.target.value,
                )
              }
              placeholder={
                mode === 'email'
                  ? 'you@example.com'
                  : '+91 98765 43210'
              }
              autoComplete={
                mode === 'email'
                  ? 'email'
                  : 'tel'
              }
              disabled={
                loading ||
                googleLoading
              }
            />
          </div>

          <button
            type="submit"
            className="register-primary-button"
            disabled={
              loading ||
              googleLoading
            }
          >
            {loading ? (
              <>
                <span className="register-button-loader" />
                Sending code...
              </>
            ) : (
              <>
                Create account
                <ArrowIcon />
              </>
            )}
          </button>
        </form>

        <div className="register-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="register-google-button"
          onClick={
            handleGoogleRegister
          }
          disabled={
            loading ||
            googleLoading
          }
        >
          {googleLoading ? (
            <span className="register-google-loader" />
          ) : (
            <GoogleIcon />
          )}

          Continue with Google
        </button>

        <div className="register-switch">
          Already have an account?

          <Link
            to={`/login?redirect=${encodeURIComponent(
              redirect,
            )}`}
          >
            Sign in
          </Link>
        </div>

        <div className="register-security">
          <span />
          Secure passwordless registration
        </div>

        <div className="register-legal">
          By continuing, you agree to the
          WildFloral terms and privacy policy.
        </div>
      </section>
    </main>
  )
}

function getFriendlyAuthError(
  message: string,
) {
  const normalized =
    message.toLowerCase()

  if (
    normalized.includes(
      'rate limit',
    )
  ) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (
    normalized.includes(
      'provider is not enabled',
    )
  ) {
    return 'This authentication method is not enabled in Supabase yet.'
  }

  if (
    normalized.includes(
      'phone provider',
    )
  ) {
    return 'Mobile OTP is not configured in Supabase yet.'
  }

  return (
    message ||
    'Unable to create your account. Please try again.'
  )
}

export default Register