import type { ChangeEvent } from 'react'
import './ContactPreferenceStep.css'

type ContactPreference =
  | 'email'
  | 'whatsapp'
  | 'call'
  | 'message'
  | 'personal_home_enquiry'
  | ''

type ContactPreferenceStepProps = {
  value: ContactPreference
  onChange: (
    value: ContactPreference,
  ) => void
}

const CONTACT_OPTIONS: Array<{
  value: Exclude<ContactPreference, ''>
  title: string
  description: string
}> = [
  {
    value: 'email',
    title: 'Email',
    description:
      'Receive enquiry updates and responses by email.',
  },
  {
    value: 'whatsapp',
    title: 'WhatsApp',
    description:
      'Our team can contact you through WhatsApp.',
  },
  {
    value: 'call',
    title: 'Phone Call',
    description:
      'Speak directly with our beauty team.',
  },
  {
    value: 'message',
    title: 'Message',
    description:
      'Receive updates through your phone messages.',
  },
  {
    value: 'personal_home_enquiry',
    title: 'Personal Home Enquiry',
    description:
      'Request a personal consultation at your home.',
  },
]

function ContactPreferenceStep({
  value,
  onChange,
}: ContactPreferenceStepProps) {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onChange(
      event.target.value as ContactPreference,
    )
  }

  return (
    <section className="contact-preference-step">
      <div className="contact-preference-header">
        <span className="contact-preference-eyebrow">
          CONTACT PREFERENCE
        </span>

        <h2>
          How would you like us to
          <span> contact you?</span>
        </h2>

        <p>
          Choose your preferred way to receive
          updates about your beauty enquiry.
        </p>
      </div>

      <div
        className="contact-preference-options"
        role="radiogroup"
        aria-label="Contact preference"
      >
        {CONTACT_OPTIONS.map((option) => {
          const isSelected =
            value === option.value

          return (
            <label
              key={option.value}
              className={`contact-preference-option ${
                isSelected
                  ? 'is-selected'
                  : ''
              }`}
            >
              <input
                type="radio"
                name="contact-preference"
                value={option.value}
                checked={isSelected}
                onChange={handleChange}
              />

              <span className="contact-preference-radio">
                <span />
              </span>

              <span className="contact-preference-content">
                <strong>
                  {option.title}
                </strong>

                <small>
                  {option.description}
                </small>
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export default ContactPreferenceStep