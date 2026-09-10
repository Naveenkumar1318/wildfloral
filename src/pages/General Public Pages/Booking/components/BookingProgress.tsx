import { Check } from 'lucide-react'

/* =========================================================
   TYPES
========================================================= */

export type BookingFlowMode =
  | 'booking'
  | 'enquiry'

type BookingProgressProps = {
  currentStep: 1 | 2 | 3 | 4 | 5

  mode?: BookingFlowMode
}

/* =========================================================
   STEP LABELS
========================================================= */

const BOOKING_STEP_LABELS = [
  'Services',
  'People',
  'Date & Time',
  'Location',
  'Review',
] as const

const ENQUIRY_STEP_LABELS = [
  'Services',
  'People',
  'Date & Time',
  'Contact',
  'Review',
] as const

/* =========================================================
   COMPONENT
========================================================= */

function BookingProgress({
  currentStep,
  mode = 'booking',
}: BookingProgressProps) {
  const stepLabels =
    mode === 'enquiry'
      ? ENQUIRY_STEP_LABELS
      : BOOKING_STEP_LABELS

  return (
    <nav
      className="booking-progress"
      aria-label={
        mode === 'enquiry'
          ? 'Enquiry progress'
          : 'Booking progress'
      }
    >
      <div className="booking-progress-inner">

        {stepLabels.map(
          (label, index) => {
            const step =
              (index + 1) as 1 | 2 | 3 | 4 | 5

            const active =
              currentStep === step

            const completed =
              currentStep > step

            return (
              <div
                key={label}
                className={
                  completed
                    ? 'booking-progress-step completed'
                    : active
                      ? 'booking-progress-step active'
                      : 'booking-progress-step'
                }
                aria-current={
                  active
                    ? 'step'
                    : undefined
                }
              >
                <span>
                  {completed ? (
                    <Check
                      size={14}
                    />
                  ) : (
                    step
                  )}
                </span>

                <small>
                  {label}
                </small>
              </div>
            )
          },
        )}

      </div>
    </nav>
  )
}

export default BookingProgress