import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router'

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

import './Login.css'

type LoginMethod = 'email' | 'phone'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const query =
    new URLSearchParams(location.search)

  const redirect =
    query.get('redirect') || '/account'

  const verifyMode =
    query.get('verify') === '1'

  const [method, setMethod] =
    useState<LoginMethod>('email')

  const [email, setEmail] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [otp, setOtp] =
    useState('')

  const [otpSent, setOtpSent] =
    useState(false)

  const [resendSeconds, setResendSeconds] =
    useState(0)

  const [loading, setLoading] =
    useState(false)

  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  /*
   * Register.tsx sends the user here
   * after requesting an OTP.
   *
   * Restore the registration identifier
   * and immediately show verification.
   */
  useEffect(() => {
    if (!verifyMode) {
      return
    }

    const storedIdentifier =
      sessionStorage.getItem(
        'wildfloral_register_identifier',
      )

    const storedMode =
      sessionStorage.getItem(
        'wildfloral_register_mode',
      )

    if (
      storedIdentifier &&
      (storedMode === 'email' ||
        storedMode === 'phone')
    ) {
      setMethod(storedMode)

      if (storedMode === 'email') {
        setEmail(storedIdentifier)
      } else {
        setPhone(storedIdentifier)
      }

      setOtpSent(true)

      setMessage(
        'Enter the verification code sent to you.',
      )

      setResendSeconds(60)
    }
  }, [verifyMode])

  /*
   * OTP cooldown.
   */
  useEffect(() => {
    if (resendSeconds <= 0) {
      return
    }

    const timer =
      window.setInterval(() => {
        setResendSeconds(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        )
      }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [resendSeconds])

  function cleanPhone() {
    return phone
      .trim()
      .replace(/\s+/g, '')
  }

  function validateEmail() {
    const value =
      email.trim()

    if (!value) {
      setError(
        'Please enter your email address.',
      )

      return false
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        value,
      )
    ) {
      setError(
        'Please enter a valid email address.',
      )

      return false
    }

    return true
  }

  function validatePhone() {
    const value =
      cleanPhone()

    if (!value) {
      setError(
        'Please enter your mobile number.',
      )

      return false
    }

    if (
      !/^\+[1-9]\d{7,14}$/.test(
        value,
      )
    ) {
      setError(
        'Use your country code, for example +919876543210.',
      )

      return false
    }

    return true
  }

  async function sendOtp() {
    setError('')
    setMessage('')

    if (resendSeconds > 0) {
      setError(
        `Please wait ${resendSeconds} seconds before requesting another code.`,
      )

      return
    }

    if (
      method === 'email' &&
      !validateEmail()
    ) {
      return
    }

    if (
      method === 'phone' &&
      !validatePhone()
    ) {
      return
    }

    setLoading(true)

    try {
      const result =
        method === 'email'
          ? await supabase.auth.signInWithOtp(
              {
                email:
                  email.trim(),

                options: {
                  shouldCreateUser:
                    true,
                },
              },
            )
          : await supabase.auth.signInWithOtp(
              {
                phone:
                  cleanPhone(),

                options: {
                  shouldCreateUser:
                    true,
                },
              },
            )

      if (result.error) {
        const text =
          result.error.message.toLowerCase()

        if (
          text.includes('rate limit') ||
          text.includes('too many') ||
          text.includes('429')
        ) {
          setResendSeconds(60)

          setError(
            'Too many requests. Please wait before requesting another code.',
          )

          return
        }

        setError(
          result.error.message ||
            'Unable to send the verification code.',
        )

        return
      }

      setOtpSent(true)

      setResendSeconds(60)

      setMessage(
        method === 'email'
          ? `Code sent to ${email.trim()}.`
          : `Code sent to ${cleanPhone()}.`,
      )
    } catch {
      setError(
        'Unable to send the verification code. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMessage('')

    if (!/^\d{6}$/.test(otp)) {
      setError(
        'Enter the 6-digit verification code.',
      )

      return
    }

    setLoading(true)

    try {
      const result =
        method === 'email'
          ? await supabase.auth.verifyOtp(
              {
                email:
                  email.trim(),
                token: otp,
                type: 'email',
              },
            )
          : await supabase.auth.verifyOtp(
              {
                phone:
                  cleanPhone(),
                token: otp,
                type: 'sms',
              },
            )

      if (result.error) {
        setError(
          result.error.message ||
            'Invalid or expired verification code.',
        )

        return
      }

      if (!result.data.session) {
        setError(
          'Verification completed, but your session could not be created.',
        )

        return
      }

      /*
       * Registration metadata is handled by
       * Supabase user metadata.
       *
       * Profile creation should be handled
       * by your database trigger if configured.
       */
      sessionStorage.removeItem(
        'wildfloral_register_name',
      )

      sessionStorage.removeItem(
        'wildfloral_register_identifier',
      )

      sessionStorage.removeItem(
        'wildfloral_register_mode',
      )

      navigate(
        redirect || '/account',
        {
          replace: true,
        },
      )
    } catch {
      setError(
        'Verification failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function continueWithGoogle() {
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
          result.error.message ||
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

  function changeMethod(
    nextMethod: LoginMethod,
  ) {
    setMethod(nextMethod)

    setOtpSent(false)
    setOtp('')
    setError('')
    setMessage('')
    setResendSeconds(0)
  }

  function startOver() {
    setOtpSent(false)
    setOtp('')
    setError('')
    setMessage('')
    setResendSeconds(0)
  }

  return (
    <main className="login-page">
      <section className="login-container">
        <div className="login-brand">
          <Link
            to="/"
            className="login-logo"
          >
            WildFloral
          </Link>

          <span>
            BEAUTY · FASHION · YOU
          </span>
        </div>

        <div className="login-content">
          <div className="login-heading">
            <span className="login-eyebrow">
              {otpSent
                ? 'SECURE VERIFICATION'
                : 'WELCOME BACK'}
            </span>

            <h1>
              {otpSent ? (
                <>
                  Verify your
                  <span>
                    identity.
                  </span>
                </>
              ) : (
                <>
                  Welcome
                  <span>
                    back.
                  </span>
                </>
              )}
            </h1>

            <p>
              {otpSent
                ? 'Enter the verification code we sent you.'
                : 'Sign in securely and continue your WildFloral experience.'}
            </p>
          </div>

          {!otpSent && (
            <>
              <button
                type="button"
                className="login-google-button"
                onClick={
                  continueWithGoogle
                }
                disabled={
                  googleLoading ||
                  loading
                }
              >
                <span className="login-google-icon">
                  G
                </span>

                {googleLoading
                  ? 'Connecting...'
                  : 'Continue with Google'}
              </button>

              <div className="login-divider">
                <span />
                <small>
                  OR CONTINUE WITH
                </small>
                <span />
              </div>

              <div className="login-method-switch">
                <button
                  type="button"
                  className={
                    method === 'email'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    changeMethod(
                      'email',
                    )
                  }
                >
                  <Mail size={15} />
                  Email
                </button>

                <button
                  type="button"
                  className={
                    method === 'phone'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    changeMethod(
                      'phone',
                    )
                  }
                >
                  <Phone size={15} />
                  Mobile
                </button>
              </div>

              <div className="login-form">
                {method === 'email' && (
                  <div className="login-field">
                    <label htmlFor="login-email">
                      Email address
                    </label>

                    <div className="login-input-wrap">
                      <Mail size={17} />

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
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {method === 'phone' && (
                  <div className="login-field">
                    <label htmlFor="login-phone">
                      Mobile number
                    </label>

                    <div className="login-input-wrap">
                      <Phone size={17} />

                      <input
                        id="login-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value,
                          )
                        }
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        disabled={loading}
                      />
                    </div>

                    <small className="login-helper">
                      Include your country
                      code.
                    </small>
                  </div>
                )}

                {error && (
                  <div
                    className="login-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {message && (
                  <div
                    className="login-message"
                    role="status"
                  >
                    <Check size={15} />
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  className="login-primary-button"
                  onClick={sendOtp}
                  disabled={
                    loading ||
                    resendSeconds > 0
                  }
                >
                  {loading
                    ? 'Sending...'
                    : resendSeconds > 0
                      ? `Try again in ${resendSeconds}s`
                      : 'Send verification code'}

                  {!loading &&
                    resendSeconds ===
                      0 && (
                      <ArrowRight
                        size={18}
                      />
                    )}
                </button>
              </div>
            </>
          )}

          {otpSent && (
            <form
              className="login-form"
              onSubmit={verifyOtp}
            >
              <div className="login-otp-card">
                <div className="login-otp-icon">
                  {method ===
                  'email' ? (
                    <Mail size={19} />
                  ) : (
                    <Phone size={19} />
                  )}
                </div>

                <div>
                  <strong>
                    Verification code
                  </strong>

                  <span>
                    {method ===
                    'email'
                      ? email.trim()
                      : cleanPhone()}
                  </span>
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-otp">
                  Enter code
                </label>

                <input
                  id="login-otp"
                  className="login-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(
                        /\D/g,
                        '',
                      ),
                    )
                  }
                  placeholder="000000"
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="login-message"
                  role="status"
                >
                  <Check size={15} />
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="login-primary-button"
                disabled={
                  loading ||
                  otp.length !== 6
                }
              >
                {loading
                  ? 'Verifying...'
                  : 'Verify & Continue'}

                {!loading && (
                  <ArrowRight
                    size={18}
                  />
                )}
              </button>

              <div className="login-resend-row">
                <span>
                  Didn't receive it?
                </span>

                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={
                    loading ||
                    resendSeconds > 0
                  }
                >
                  {resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : 'Resend code'}
                </button>
              </div>

              <button
                type="button"
                className="login-back-button"
                onClick={startOver}
                disabled={loading}
              >
                <ArrowLeft size={15} />
                Use another method
              </button>
            </form>
          )}

          <div className="login-security">
            <ShieldCheck size={15} />
            Secure passwordless authentication
          </div>

          {!otpSent && (
            <p className="login-register-text">
              New to WildFloral?

              <Link to="/register">
                Create an account
              </Link>
            </p>
          )}
        </div>
      </section>

      <aside className="login-visual">
        <div className="login-visual-content">
          <span>
            WILDFLORAL
          </span>

          <h2>
            Beauty,
            <br />
            <em>beautifully</em>
            <br />
            personal.
          </h2>

          <p>
            Your services, your style,
            your experience.
          </p>
        </div>
      </aside>
    </main>
  )
}

export default Login