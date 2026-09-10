import { useEffect } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../../lib/supabase'

function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    async function handleCallback() {
      try {
        const params =
          new URLSearchParams(
            location.search,
          )

        const redirect =
          params.get('redirect') ||
          '/account'

        const authMode =
          params.get('auth_mode') ||
          'login'

        /* =====================================================
           GET AUTH SESSION
        ===================================================== */

        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession()

        if (!mounted) {
          return
        }

        if (
          sessionError ||
          !session?.user
        ) {
          console.error(
            'Auth callback session error:',
            sessionError,
          )

          await supabase.auth.signOut()

          navigate(
            `/login?redirect=${encodeURIComponent(
              redirect,
            )}&error=authentication_failed`,
            {
              replace: true,
            },
          )

          return
        }

        const user =
          session.user

        /* =====================================================
           GET CUSTOMER PROFILE
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
              user.id,
            )
            .maybeSingle()

        if (!mounted) {
          return
        }

        if (profileError) {
          console.error(
            'Auth callback profile error:',
            profileError,
          )

          await supabase.auth.signOut()

          navigate(
            `/login?redirect=${encodeURIComponent(
              redirect,
            )}&error=profile_check_failed`,
            {
              replace: true,
            },
          )

          return
        }

        /* =====================================================
           GOOGLE REGISTRATION
        ===================================================== */

        if (
          authMode ===
          'register'
        ) {
          /* ---------------------------------------------------
             EXISTING ADMIN
          --------------------------------------------------- */

          if (
            profile?.role ===
            'admin'
          ) {
            await supabase.auth.signOut()

            navigate(
              '/register?error=admin_account',
              {
                replace: true,
              },
            )

            return
          }

          /* ---------------------------------------------------
             EXISTING CUSTOMER
          --------------------------------------------------- */

          if (
            profile?.role ===
            'customer'
          ) {
            await supabase.auth.signOut()

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

          /* ---------------------------------------------------
             CREATE CUSTOMER PROFILE

             IMPORTANT:
             This is the ONLY place where a Google OAuth
             registration creates the WildFloral customer
             profile.

             Google LOGIN never reaches this block.
          --------------------------------------------------- */

          if (!profile) {
            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              ''

            const {
              data: createdProfile,
              error:
                createProfileError,
            } =
              await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email:
                    user.email ??
                    '',
                  full_name:
                    fullName,
                  role: 'customer',
                })
                .select(
                  'id, email, full_name, role',
                )
                .single()

            if (!mounted) {
              return
            }

            if (
              createProfileError
            ) {
              console.error(
                'Google registration profile creation error:',
                createProfileError,
              )

              await supabase.auth.signOut()

              navigate(
                `/register?redirect=${encodeURIComponent(
                  redirect,
                )}&error=registration_failed`,
                {
                  replace: true,
                },
              )

              return
            }

            if (
              !createdProfile ||
              createdProfile.role !==
                'customer'
            ) {
              await supabase.auth.signOut()

              navigate(
                '/register?error=invalid_customer_account',
                {
                  replace: true,
                },
              )

              return
            }
          }

          /* ---------------------------------------------------
             GOOGLE REGISTRATION SUCCESS
          --------------------------------------------------- */

          navigate(
            redirect,
            {
              replace: true,
            },
          )

          return
        }

        /* =====================================================
           GOOGLE LOGIN
        ===================================================== */

        /*
         * IMPORTANT:
         *
         * Google authentication succeeding does NOT mean
         * that a WildFloral customer account exists.
         *
         * The profile must already exist.
         */

        if (!profile) {
          await supabase.auth.signOut()

          navigate(
            `/register?redirect=${encodeURIComponent(
              redirect,
            )}&error=account_not_found`,
            {
              replace: true,
            },
          )

          return
        }

        /* =====================================================
           ADMIN BLOCK
        ===================================================== */

        if (
          profile.role ===
          'admin'
        ) {
          await supabase.auth.signOut()

          navigate(
            `/login?redirect=${encodeURIComponent(
              redirect,
            )}&error=admin_account`,
            {
              replace: true,
            },
          )

          return
        }

        /* =====================================================
           INVALID ROLE
        ===================================================== */

        if (
          profile.role !==
          'customer'
        ) {
          await supabase.auth.signOut()

          navigate(
            `/login?redirect=${encodeURIComponent(
              redirect,
            )}&error=invalid_customer_account`,
            {
              replace: true,
            },
          )

          return
        }

        /* =====================================================
           EXISTING CUSTOMER LOGIN SUCCESS
        ===================================================== */

        navigate(
          redirect,
          {
            replace: true,
          },
        )
      } catch (error) {
        console.error(
          'Auth callback error:',
          error,
        )

        if (!mounted) {
          return
        }

        await supabase.auth.signOut()

        navigate(
          '/login?redirect=%2Faccount&error=authentication_failed',
          {
            replace: true,
          },
        )
      }
    }

    void handleCallback()

    return () => {
      mounted = false
    }
  }, [
    location.search,
    navigate,
  ])

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <p>
        Completing secure sign in...
      </p>
    </main>
  )
}

export default AuthCallback