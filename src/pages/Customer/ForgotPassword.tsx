import {
  FormEvent,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router'

import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Check,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './ForgotPassword.css'

function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [sent, setSent] =
    useState(false)

  const [error, setError] =
    useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const value =
      email.trim()

    if (!value) {
      setError(
        'Enter your email address.',
      )

      return
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value,
      )
    ) {
      setError(
        'Enter a valid email address.',
      )

      return
    }

    setLoading(true)

    try {
      const {
        error: otpError,
      } =
        await supabase.auth.signInWithOtp(
          {
            email: value,

            options: {
              shouldCreateUser: false,
            },
          },
        )

      if (otpError) {
        setError(
          otpError.message ||
            'Unable to send the verification code.',
        )

        return
      }

      setSent(true)
    } catch {
      setError(
        'Unable to send the verification code.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="register-page">
        <section className="register-form-area">
          <div className="register-form-header">
            <span>
              CHECK YOUR EMAIL
            </span>

            <h2>
              Your code is
              <em>
                on its way.
              </em>
            </h2>

            <p>
              We sent a verification code to
              {` ${email.trim()}`}.
            </p>
          </div>

          <div className="register-message register-message-success">
            <Check size={15} />

            Check your email for the
            verification code.
          </div>

          <button
            type="button"
            className="register-primary-button"
            onClick={() =>
              navigate('/login')
            }
          >
            Back to sign in
            <ArrowRight size={18} />
          </button>
        </section>

        <section className="register-intro">
          <Link
            to="/"
            className="register-brand"
          >
            WildFloral
          </Link>

          <div className="register-intro-content">
            <span className="register-intro-eyebrow">
              WILDFLORAL
            </span>

            <h1>
              Simple,
              <span>
                secure access.
              </span>
            </h1>

            <p>
              No passwords to remember.
              Just a secure verification
              code when you need it.
            </p>
          </div>
        </section>
      </main>
    )
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
            WILDFLORAL ACCESS
          </span>

          <h1>
            Come back
            <span>
              beautifully.
            </span>
          </h1>

          <p>
            Enter your email and we'll send
            you a secure verification code.
            No password required.
          </p>
        </div>
      </section>

      <section className="register-form-area">
        <div className="register-form-header">
          <span>
            SECURE ACCESS
          </span>

          <h2>
            Sign in with
            <em>
              a code.
            </em>
          </h2>

          <p>
            Enter the email connected to
            your WildFloral account.
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

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="register-field">
            <label htmlFor="recovery-email">
              Email address
            </label>

            <div
              style={{
                position: 'relative',
              }}
            >
              <Mail
                size={17}
                style={{
                  position:
                    'absolute',
                  left: 15,
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  color: '#aaa2ad',
                  pointerEvents:
                    'none',
                }}
              />

              <input
                id="recovery-email"
                className="register-input"
                style={{
                  paddingLeft: 44,
                }}
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="register-primary-button"
            disabled={loading}
          >
            {loading
              ? 'Sending...'
              : 'Send verification code'}

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>

        <div className="register-switch">
          Remembered your account?

          <Link to="/login">
            Sign in
          </Link>
        </div>

        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 24,
            color: '#918a96',
            fontSize: 9,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to WildFloral
        </Link>
      </section>
    </main>
  )
}

export default ForgotPassword