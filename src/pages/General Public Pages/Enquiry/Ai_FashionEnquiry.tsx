import { useEffect, useRef, useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'

import { createCustomDesignEnquiry } from '../../../lib/customDesignEnquiries'

import {
  fashionQuestionFlow,
  type FashionQuestion,
  type FashionMainType,
  type FashionSubtype,
} from '../../../data/fashionQuestionFlow'

import './Ai_FashionEnquiry.css'

/* =========================================================
   TYPES
========================================================= */

interface Ai_FashionEnquiryProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hideFloatingButton?: boolean
}

type Step =
  | 'checking_auth'
  | 'auth'
  | 'main_type'
  | 'subtype'
  | 'questions'
  | 'reference'
  | 'additional'
  | 'contact_name'
  | 'contact_phone'
  | 'review'
  | 'success'

type MessageSender = 'assistant' | 'user'

interface ChatMessage {
  id: number
  sender: MessageSender
  text: string
  options?: string[]
}

interface EnquiryData {
  mainType: string
  subtype: string
  answers: Record<string, string>
  referenceImage: string
  additionalRequirements: string
  name: string
  phone: string
}

/* =========================================================
   CONSTANTS
========================================================= */

const INITIAL_DATA: EnquiryData = {
  mainType: '',
  subtype: '',
  answers: {},
  referenceImage: '',
  additionalRequirements: '',
  name: '',
  phone: '',
}

const REFERENCE_OPTIONS = ['Yes, I will share on WhatsApp', 'No reference']

const ADDITIONAL_OPTIONS = ['No', 'Yes']

const PHONE_NUMBER = '8838894677'

const PENDING_KEY = 'pending_custom_design_enquiry'

// Valid Indian mobile number: 10 digits starting with 6-9
const MOBILE_REGEX = /^[6-9]\d{9}$/

/* =========================================================
   COMPONENT
========================================================= */

function Ai_FashionEnquiry({
  isOpen,
  onOpenChange,
  hideFloatingButton = false,
}: Ai_FashionEnquiryProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // True once a conversation has started, so reopening the drawer keeps progress
  const conversationStartedRef = useRef(false)

  const [step, setStep] = useState<Step>('checking_auth')
  const [data, setData] = useState<EnquiryData>(INITIAL_DATA)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestions, setCurrentQuestions] = useState<FashionQuestion[]>([])

  const [selectedMainType, setSelectedMainType] =
    useState<FashionMainType | null>(null)
  const [, setSelectedSubtype] = useState<FashionSubtype | null>(null)

  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [authChecking, setAuthChecking] = useState(false)
  const [awaitingAdditionalText, setAwaitingAdditionalText] = useState(false)

  /* =========================================================
     HELPERS
  ========================================================= */

  function addMessage(
    sender: MessageSender,
    text: string,
    options?: string[],
  ) {
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        sender,
        text,
        options,
      },
    ])
  }

  function updateData(key: keyof EnquiryData, value: string) {
    setData((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function getMainTypeOptions() {
    return fashionQuestionFlow.map((item) => item.label)
  }

  function getSubtypeOptions(mainType: FashionMainType) {
    return mainType.subtypes.map((item) => item.label)
  }

  /* =========================================================
     START CONVERSATION
  ========================================================= */

  function startConversation() {
    conversationStartedRef.current = true

    setStep('main_type')
    setData(INITIAL_DATA)

    setSelectedMainType(null)
    setSelectedSubtype(null)

    setCurrentQuestions([])
    setCurrentQuestionIndex(0)

    setInputValue('')
    setErrorMessage('')
    setAwaitingAdditionalText(false)

    setMessages([
      {
        id: 1,
        sender: 'assistant',
        text: 'Hello! 👋 I am your Fashion Design Assistant. I can help collect your custom design requirements.',
      },
      {
        id: 2,
        sender: 'assistant',
        text: 'What type of fashion service do you need?',
        options: getMainTypeOptions(),
      },
    ])
  }

  /* =========================================================
     AUTH CHECK (runs each time the drawer opens)
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let mounted = true

    async function checkAuthentication() {
      setAuthChecking(true)
      setErrorMessage('')

      const { data: authData } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      setAuthChecking(false)

      if (authData.session?.user) {
        // Keep existing progress when the drawer is reopened
        if (!conversationStartedRef.current) {
          startConversation()
        }
        return
      }

      conversationStartedRef.current = false

      sessionStorage.setItem(PENDING_KEY, '1')

      setStep('auth')

      setMessages([
        {
          id: 1,
          sender: 'assistant',
          text: 'Welcome! 👋 Please login or create your customer account to start your fashion enquiry.',
        },
      ])
    }

    void checkAuthentication()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  /* =========================================================
     RESTORE AFTER LOGIN / REGISTER
  ========================================================= */

  useEffect(() => {
    const params = new URLSearchParams(location.search)

    if (params.get('fashion_enquiry') !== '1') {
      return
    }

    let mounted = true

    async function restoreAfterAuth() {
      const { data: authData } = await supabase.auth.getSession()

      if (!mounted || !authData.session?.user) {
        return
      }

      sessionStorage.removeItem(PENDING_KEY)

      onOpenChange(true)

      startConversation()

      params.delete('fashion_enquiry')

      const cleanSearch = params.toString()

      const cleanUrl = `${location.pathname}${
        cleanSearch ? `?${cleanSearch}` : ''
      }`

      navigate(cleanUrl, { replace: true })
    }

    void restoreAfterAuth()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navigate, onOpenChange])

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onOpenChange])

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, step, errorMessage, isOpen])

  /* =========================================================
     FLOW HANDLERS
  ========================================================= */

  function handleMainTypeSelect(value: string) {
    const mainType = fashionQuestionFlow.find(
      (item) => item.value === value || item.label === value,
    )

    if (!mainType) {
      return
    }

    setSelectedMainType(mainType)
    setSelectedSubtype(null)
    setCurrentQuestions([])
    setCurrentQuestionIndex(0)

    updateData('mainType', mainType.value)

    addMessage('user', mainType.label)

    addMessage(
      'assistant',
      `What type of ${mainType.label.toLowerCase()} would you like?`,
      getSubtypeOptions(mainType),
    )

    setStep('subtype')
    setErrorMessage('')
  }

  function handleSubtypeSelect(value: string) {
    if (!selectedMainType) {
      return
    }

    const subtype = selectedMainType.subtypes.find(
      (item) => item.value === value || item.label === value,
    )

    if (!subtype) {
      return
    }

    setSelectedSubtype(subtype)
    setCurrentQuestions(subtype.questions)
    setCurrentQuestionIndex(0)

    updateData('subtype', subtype.value)

    addMessage('user', subtype.label)

    if (subtype.questions.length === 0) {
      showReferenceQuestion()
    } else {
      const firstQuestion = subtype.questions[0]

      addMessage(
        'assistant',
        firstQuestion.question,
        firstQuestion.options?.map((option) => option.label),
      )

      setStep('questions')
    }

    setErrorMessage('')
  }

  function showReferenceQuestion() {
    addMessage(
      'assistant',
      'Do you have a reference image or design?',
      REFERENCE_OPTIONS,
    )

    setStep('reference')
  }

  function showAdditionalQuestion() {
    addMessage(
      'assistant',
      'Do you have any additional requirements?',
      ADDITIONAL_OPTIONS,
    )

    setStep('additional')
  }

  function moveToNextQuestion(questions: FashionQuestion[], nextIndex: number) {
    if (nextIndex >= questions.length) {
      showReferenceQuestion()
      return
    }

    const nextQuestion = questions[nextIndex]

    setCurrentQuestionIndex(nextIndex)

    addMessage(
      'assistant',
      nextQuestion.question,
      nextQuestion.options?.map((option) => option.label),
    )
  }

  function handleQuestionAnswer(value: string) {
    const question = currentQuestions[currentQuestionIndex]

    if (!question) {
      return
    }

    setErrorMessage('')

    setData((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [question.id]: value,
      },
    }))

    addMessage('user', value)

    moveToNextQuestion(currentQuestions, currentQuestionIndex + 1)
  }

  function handleReferenceAnswer(value: string) {
    updateData('referenceImage', value)

    addMessage('user', value)

    showAdditionalQuestion()
  }

  function handleAdditionalAnswer(value: string) {
    if (value === 'No') {
      updateData('additionalRequirements', 'No additional requirements')

      addMessage('user', value)

      addMessage('assistant', 'Almost done! Please enter your name.')

      setStep('contact_name')
      return
    }

    if (value === 'Yes') {
      addMessage('user', value)

      addMessage('assistant', 'Please type your additional requirements.')

      setInputValue('')
      setAwaitingAdditionalText(true)
    }
  }

  /* =========================================================
     TEXT ANSWER
  ========================================================= */

  function handleTextSubmit() {
    const value = inputValue.trim()

    if (!value) {
      setErrorMessage('Please enter your answer.')
      return
    }

    setErrorMessage('')

    // Free-text question from the flow
    if (step === 'questions') {
      const question = currentQuestions[currentQuestionIndex]

      if (question?.allowText) {
        setData((current) => ({
          ...current,
          answers: {
            ...current.answers,
            [question.id]: value,
          },
        }))

        addMessage('user', value)

        setInputValue('')

        moveToNextQuestion(currentQuestions, currentQuestionIndex + 1)
      }

      return
    }

    // Additional requirements
    if (step === 'additional') {
      setData((current) => ({
        ...current,
        additionalRequirements: value,
      }))

      addMessage('user', value)

      addMessage('assistant', 'Thank you. Please enter your name.')

      setInputValue('')
      setAwaitingAdditionalText(false)

      setStep('contact_name')

      return
    }

    // Name
    if (step === 'contact_name') {
      setData((current) => ({
        ...current,
        name: value,
      }))

      addMessage('user', value)

      addMessage('assistant', 'Thank you! Please enter your mobile number.')

      setInputValue('')

      setStep('contact_phone')

      return
    }

    // Phone
    if (step === 'contact_phone') {
      const phone = value.replace(/\D/g, '')

      if (!MOBILE_REGEX.test(phone)) {
        setErrorMessage('Please enter a valid 10-digit mobile number.')
        return
      }

      setData((current) => ({
        ...current,
        phone,
      }))

      addMessage('user', phone)

      addMessage('assistant', 'Please review your enquiry before submitting.')

      setInputValue('')

      setStep('review')
    }
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  function handleLogin() {
    const currentPath = `${location.pathname}${location.search}`

    const separator = currentPath.includes('?') ? '&' : '?'

    const redirectUrl = `${currentPath}${separator}fashion_enquiry=1`

    sessionStorage.setItem(PENDING_KEY, '1')

    navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
  }

  /* =========================================================
     RESET CHAT
  ========================================================= */

  function resetChat() {
    sessionStorage.removeItem(PENDING_KEY)

    conversationStartedRef.current = false

    setData(INITIAL_DATA)
    setMessages([])
    setCurrentQuestionIndex(0)
    setCurrentQuestions([])
    setSelectedMainType(null)
    setSelectedSubtype(null)
    setInputValue('')
    setErrorMessage('')
    setIsSubmitting(false)
    setAwaitingAdditionalText(false)
    setStep('checking_auth')

    if (!isOpen) {
      return
    }

    setAuthChecking(true)

    void supabase.auth
      .getSession()
      .then(({ data: authData }) => {
        if (authData.session?.user) {
          startConversation()
          return
        }

        setStep('auth')

        setMessages([
          {
            id: 1,
            sender: 'assistant',
            text: 'Please login or create your customer account to start a new enquiry.',
          },
        ])
      })
      .finally(() => {
        setAuthChecking(false)
      })
  }

  /* =========================================================
     BUILD REQUIREMENTS PAYLOAD
  ========================================================= */

  function buildRequirements() {
    return {
      main_type: data.mainType,
      subtype: data.subtype,
      ...data.answers,
      reference_image: data.referenceImage,
      additional_requirements:
        data.additionalRequirements || 'No additional requirements',
    }
  }

  /* =========================================================
     SUBMIT ENQUIRY
  ========================================================= */

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    setErrorMessage('')

    const { data: authData } = await supabase.auth.getUser()

    const user = authData.user

    if (!user) {
      sessionStorage.setItem(PENDING_KEY, '1')

      const redirectUrl = `${location.pathname}?fashion_enquiry=1`

      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)

      return
    }

    if (!data.mainType) {
      setErrorMessage('Please select a fashion service.')
      return
    }

    if (!data.subtype) {
      setErrorMessage('Please select a design type.')
      return
    }

    if (!data.name.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    if (!MOBILE_REGEX.test(data.phone)) {
      setErrorMessage('Valid mobile number is required.')
      return
    }

    try {
      setIsSubmitting(true)

      await createCustomDesignEnquiry({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: user.email || undefined,
        designType: data.subtype.trim(),
        requirements: buildRequirements(),
        preferredDate: undefined,
        referenceImageUrl: undefined,
        additionalNotes: data.additionalRequirements || undefined,
      })

      sessionStorage.removeItem(PENDING_KEY)

      setStep('success')

      addMessage(
        'assistant',
        'Thank you! Your fashion enquiry has been submitted successfully. Our team will contact you soon.',
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit your enquiry. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  /* =========================================================
     OPTION CLICK ROUTER
  ========================================================= */

  function handleOptionClick(option: string) {
    switch (step) {
      case 'main_type':
        handleMainTypeSelect(option)
        break
      case 'subtype':
        handleSubtypeSelect(option)
        break
      case 'questions':
        handleQuestionAnswer(option)
        break
      case 'reference':
        handleReferenceAnswer(option)
        break
      case 'additional':
        handleAdditionalAnswer(option)
        break
      default:
        break
    }
  }

  /* =========================================================
     INPUT STATE
  ========================================================= */

  const currentQuestion = currentQuestions[currentQuestionIndex]

  const showQuestionTextInput =
    step === 'questions' && currentQuestion?.allowText === true

  const showTextInput =
    showQuestionTextInput ||
    (step === 'additional' && awaitingAdditionalText) ||
    step === 'contact_name' ||
    step === 'contact_phone'

  function getInputPlaceholder() {
    if (step === 'contact_name') {
      return 'Enter your name...'
    }

    if (step === 'contact_phone') {
      return 'Enter your mobile number...'
    }

    if (step === 'additional') {
      return 'Enter your additional requirements...'
    }

    return 'Type your answer...'
  }

  const whatsappMessage = encodeURIComponent(
    'Hello, I would like to enquire about a custom fashion design.',
  )

  /* =========================================================
     FLOATING BUTTON
  ========================================================= */

  if (!isOpen) {
    if (hideFloatingButton) {
      return null
    }

    return (
      <button
        type="button"
        className="ai-fashion-float-button"
        onClick={() => onOpenChange(true)}
        aria-label="Open Fashion Design Assistant"
      >
        <span className="ai-fashion-float-icon">✦</span>

        <span className="ai-fashion-float-text">
          <strong>FASHION DESIGN</strong>
          <small>Assistant</small>
        </span>
      </button>
    )
  }

  /* =========================================================
     DRAWER
  ========================================================= */

  return (
    <>
      <button
        type="button"
        className="ai-fashion-backdrop"
        onClick={() => onOpenChange(false)}
        aria-label="Close Fashion Design Assistant"
      />

      <aside
        className="ai-fashion-drawer"
        id="ai-fashion-assistant"
        role="dialog"
        aria-modal="true"
        aria-label="Fashion Design Assistant"
      >
        {/* HEADER */}
        <header className="ai-fashion-drawer-header">
          <div className="ai-fashion-drawer-brand">
            <div className="ai-fashion-drawer-logo">✦</div>

            <div className="ai-fashion-drawer-title">
              <span>FASHION DESIGN</span>
              <h2>Assistant</h2>
              <small>Custom Design Enquiry</small>
            </div>
          </div>

          <button
            type="button"
            className="ai-fashion-close-button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {/* BODY */}
        <div className="ai-fashion-drawer-body">
          {authChecking && (
            <div className="ai-fashion-loading">Checking your account...</div>
          )}

          {/* MESSAGES */}
          {messages.map((message, index) => {
            // Only the latest message may show clickable options
            const isLastMessage = index === messages.length - 1

            return (
              <div
                key={message.id}
                className={`ai-fashion-message-row ${
                  message.sender === 'user' ? 'user-message-row' : ''
                }`}
              >
                {message.sender === 'assistant' && (
                  <div className="ai-fashion-message-avatar">✦</div>
                )}

                <div
                  className={`ai-fashion-message ${
                    message.sender === 'user'
                      ? 'ai-fashion-message-user'
                      : 'ai-fashion-message-primary'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <span className="ai-fashion-message-label">
                      FASHION DESIGN ASSISTANT
                    </span>
                  )}

                  <p>{message.text}</p>

                  {isLastMessage &&
                    message.options &&
                    message.options.length > 0 && (
                      <div className="ai-fashion-option-grid">
                        {message.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className="ai-fashion-option-button"
                            onClick={() => handleOptionClick(option)}
                            disabled={
                              isSubmitting ||
                              step === 'success' ||
                              step === 'auth' ||
                              authChecking
                            }
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            )
          })}

          {/* TEXT INPUT */}
          {showTextInput && (
            <div className="ai-fashion-input-row">
              <input
                type={step === 'contact_phone' ? 'tel' : 'text'}
                inputMode={step === 'contact_phone' ? 'numeric' : undefined}
                className="ai-fashion-text-input"
                placeholder={getInputPlaceholder()}
                value={inputValue}
                maxLength={step === 'contact_phone' ? 10 : undefined}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleTextSubmit()
                  }
                }}
              />

              <button
                type="button"
                className="ai-fashion-send-button"
                onClick={handleTextSubmit}
              >
                Send
              </button>
            </div>
          )}

          {/* AUTH */}
          {step === 'auth' && (
            <div className="ai-fashion-auth-card">
              <strong>Login required</strong>

              <p>
                Please login or create your customer account to start your
                enquiry.
              </p>

              <button
                type="button"
                className="ai-fashion-login-button"
                onClick={handleLogin}
              >
                Login / Create Account
              </button>
            </div>
          )}

          {/* ERROR */}
          {errorMessage && (
            <div className="ai-fashion-error">{errorMessage}</div>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <div className="ai-fashion-review-card">
              <span className="ai-fashion-section-label">
                REVIEW YOUR ENQUIRY
              </span>

              <div className="ai-fashion-review-item">
                <span>Service</span>
                <strong>{data.mainType || '—'}</strong>
              </div>

              <div className="ai-fashion-review-item">
                <span>Design Type</span>
                <strong>{data.subtype || '—'}</strong>
              </div>

              {Object.entries(data.answers).map(([key, value]) => (
                <div className="ai-fashion-review-item" key={key}>
                  <span>{formatLabel(key)}</span>
                  <strong>{value}</strong>
                </div>
              ))}

              <div className="ai-fashion-review-item">
                <span>Reference Image</span>
                <strong>{data.referenceImage || '—'}</strong>
              </div>

              <div className="ai-fashion-review-item">
                <span>Additional Requirements</span>
                <strong>{data.additionalRequirements || 'None'}</strong>
              </div>

              <div className="ai-fashion-review-item">
                <span>Name</span>
                <strong>{data.name || '—'}</strong>
              </div>

              <div className="ai-fashion-review-item">
                <span>Mobile</span>
                <strong>{data.phone || '—'}</strong>
              </div>

              <button
                type="button"
                className="ai-fashion-submit-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <div className="ai-fashion-success-card">
              <div className="ai-fashion-success-icon">✓</div>

              <h3>Thank You!</h3>

              <p>Your fashion enquiry has been submitted successfully.</p>

              <p>
                Our team will contact you soon regarding your requirements.
              </p>

              <div className="ai-fashion-success-actions">
                <button
                  type="button"
                  className="ai-fashion-new-chat-button"
                  onClick={resetChat}
                >
                  New Chat
                </button>

                <button
                  type="button"
                  className="ai-fashion-clear-chat-button"
                  onClick={resetChat}
                >
                  Clear Chat
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CHAT ACTIONS */}
        {step !== 'success' && step !== 'auth' && step !== 'checking_auth' && (
          <div className="ai-fashion-chat-actions">
            <button type="button" onClick={resetChat}>
              Clear Chat
            </button>

            <button type="button" onClick={resetChat}>
              New Chat
            </button>
          </div>
        )}

        {/* FOOTER */}
        <footer className="ai-fashion-drawer-footer">
          <span className="ai-fashion-help-text">Need help now?</span>

          <div className="ai-fashion-contact-actions">
            <a
              href={`https://wa.me/91${PHONE_NUMBER}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-fashion-whatsapp-button"
            >
              WhatsApp
            </a>

            <a href={`tel:${PHONE_NUMBER}`} className="ai-fashion-call-button">
              Call
            </a>
          </div>

          <small className="ai-fashion-phone-note">
            Direct / WhatsApp: {PHONE_NUMBER}
          </small>
        </footer>
      </aside>
    </>
  )
}

/* =========================================================
   REVIEW LABEL FORMATTER
========================================================= */

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export default Ai_FashionEnquiry