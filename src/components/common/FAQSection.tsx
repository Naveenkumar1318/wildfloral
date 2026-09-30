import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import './FAQSection.css'

export interface FAQItem {
  question: string
  answer: string
}

export const HOME_FAQS: FAQItem[] = [
  {
    question: 'Where is WildFloral located in Hosur?',
    answer:
      'WildFloral is located at 3-1/2, Neela Mega Nagar, 1st Cross, Hosur, Tamil Nadu 635109, India. Walk-ins and prior appointments are welcomed.',
  },
  {
    question: 'What are WildFloral’s operating hours?',
    answer:
      'Our studio is open Monday through Sunday from 09:00 AM to 09:00 PM (09:00–21:00).',
  },
  {
    question: 'What beauty and fashion services do you offer?',
    answer:
      'We offer luxury beauty therapy (bridal makeup, hair styling, skincare rituals), bespoke haute fashion (custom outfit design, bridal couture, precision tailoring), and personalized doorstep styling experiences.',
  },
  {
    question: 'How do I book an appointment or consultation?',
    answer:
      'You can book an appointment online via our booking page, or reach out directly by calling or messaging us on WhatsApp at +91 8838894677.',
  },
  {
    question: 'Does WildFloral provide doorstep beauty and styling services in Hosur?',
    answer:
      'Yes, we provide elevated doorstep beauty and fashion styling experiences across Hosur. Our master artisans bring the full luxury experience directly to your home or venue.',
  },
  {
    question: 'Do I need a prior appointment for bridal makeup or couture fittings?',
    answer:
      'While walk-ins are always welcomed for inquiries, we strongly recommend prior reservations for bridal makeup trials and custom couture fittings to ensure dedicated time in our private chamber sanctums.',
  },
  {
    question: 'What payment methods are accepted at WildFloral?',
    answer:
      'We accept UPI, Credit Cards, Debit Cards, and Cash for all studio and doorstep services.',
  },
]

interface FAQSectionProps {
  items?: FAQItem[]
  title?: string
  subtitle?: string
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  items = HOME_FAQS,
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about our Hosur beauty studio, custom fashion couture, and booking process.',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="wf-faq-section" id="faq-section" aria-labelledby="faq-heading">
      <div className="wf-faq-container">
        <div className="wf-faq-header">
          <div className="wf-faq-badge">
            <HelpCircle size={15} />
            <span>GOT QUESTIONS?</span>
          </div>
          <h2 id="faq-heading" className="wf-faq-title">
            {title}
          </h2>
          <p className="wf-faq-subtitle">{subtitle}</p>
        </div>

        <div className="wf-faq-list" role="region" aria-label="FAQ items">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className={`wf-faq-item ${isOpen ? 'wf-faq-item-open' : ''}`}
              >
                <button
                  type="button"
                  className="wf-faq-question-btn"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="wf-faq-question-text">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`wf-faq-icon ${isOpen ? 'wf-faq-icon-rotated' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className={`wf-faq-answer-wrapper ${isOpen ? 'wf-faq-answer-visible' : ''}`}
                >
                  <div className="wf-faq-answer-content">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
