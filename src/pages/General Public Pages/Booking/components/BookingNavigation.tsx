import {
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'

/* =========================================================
   TYPES
========================================================= */

export type BookingFlowMode =
  | 'booking'
  | 'enquiry'

type BookingNavigationProps = {
  currentStep: 1 | 2 | 3 | 4 | 5

  mode?: BookingFlowMode

  onBack: () => void

  onNext?: () => void

  onConfirm?: () =>
    | void
    | Promise<void>

  canContinue?: boolean

  saving?: boolean
}

/* =========================================================
   COMPONENT
========================================================= */

function BookingNavigation({
  currentStep,
  mode = 'booking',
  onBack,
  onNext,
  onConfirm,
  canContinue = true,
  saving = false,
}: BookingNavigationProps) {
  const isReviewStep =
    currentStep === 5

  const isEnquiry =
    mode === 'enquiry'

  /* =======================================================
     ACTION
  ======================================================= */

  const handleAction = () => {
    if (
      saving ||
      !canContinue
    ) {
      return
    }

    if (isReviewStep) {
      if (onConfirm) {
        void onConfirm()
      }

      return
    }

    if (onNext) {
      onNext()
    }
  }

  /* =======================================================
     LABELS
  ======================================================= */

  const reviewButtonLabel =
    saving
      ? isEnquiry
        ? 'Submitting...'
        : 'Booking...'
      : isEnquiry
        ? 'Submit Enquiry'
        : 'Book Appointment'

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="booking-navigation">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        className="booking-back-button"
        onClick={onBack}
        disabled={saving}
      >
        <ArrowLeft
          size={15}
        />

        {currentStep > 1
          ? 'Back'
          : 'Services'}
      </button>

      {/* =====================================================
          NEXT / CONFIRM
      ===================================================== */}

      <button
        type="button"
        className="booking-next-button"
        onClick={handleAction}
        disabled={
          saving ||
          !canContinue
        }
      >
        {isReviewStep ? (
          <>
            {reviewButtonLabel}

            {!saving && (
              <Check
                size={16}
              />
            )}
          </>
        ) : (
          <>
            Continue

            <ArrowRight
              size={16}
            />
          </>
        )}
      </button>

    </div>
  )
}

export default BookingNavigation