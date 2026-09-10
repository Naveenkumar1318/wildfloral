import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Moon,
  Sun,
  Sunset,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import type { BookingService } from '../Booking'

import './DateTimeStep.css'

type DateTimeStepProps = {
  date: string
  time: string
  people?: unknown[]
  totalDuration?: number
  serviceMap?: Map<string, BookingService>
  onChangeDate: (date: string) => void
  onChangeTime: (time: string) => void

  /**
   * Optional list of already-booked start times.
   *
   * Example:
   * [
   *   '09:00',
   *   '14:00',
   *   '18:00'
   * ]
   *
   * If Booking.tsx does not provide this prop,
   * all otherwise-valid slots remain selectable.
   */
  bookedTimes?: string[]
}

type TimeSlot = {
  value: string
  label: string
}

type TimeGroup = {
  id: 'morning' | 'afternoon' | 'evening' | 'night'
  title: string
  description: string
  icon: typeof Sun
  slots: TimeSlot[]
}

/**
 * IMPORTANT:
 * This controls the latest START TIME offered to customers.
 *
 * A customer can still select an evening/night start even when
 * the service duration is longer than the remaining business hours.
 *
 * Example:
 * 7:00 PM + 3 hour service
 * = allowed because the appointment STARTS before closing.
 */
const BUSINESS_CLOSING_HOUR = 22

const TIME_SLOT_INTERVAL_MINUTES = 60

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function getDateKey(date: Date): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateKey(value: string): Date | null {
  if (!value) {
    return null
  }

  const [year, month, day] =
    value.split('-').map(Number)

  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }

  const date = new Date(
    year,
    month - 1,
    day,
  )

  date.setHours(0, 0, 0, 0)

  return date
}

function formatTime(value: string): string {
  const [hour, minute] =
    value.split(':').map(Number)

  const date = new Date()

  date.setHours(
    hour,
    minute,
    0,
    0,
  )

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )
}

function formatRange(
  value: string,
): string {
  const [hour, minute] =
    value.split(':').map(Number)

  const start = new Date()

  start.setHours(
    hour,
    minute,
    0,
    0,
  )

  const end = new Date(start)

  end.setMinutes(
    end.getMinutes() +
      TIME_SLOT_INTERVAL_MINUTES,
  )

  return `${start.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )} – ${end.toLocaleTimeString(
    'en-IN',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  )}`
}

function getMinutesFromTime(
  value: string,
): number {
  const [hour, minute] =
    value.split(':').map(Number)

  return (
    hour * 60 +
    minute
  )
}

function getCurrentTimeMinutes(): number {
  const now = new Date()

  return (
    now.getHours() * 60 +
    now.getMinutes()
  )
}

function isToday(
  dateValue: string,
): boolean {
  return dateValue === getDateKey(TODAY)
}

function isPastDate(
  dateValue: string,
): boolean {
  const selectedDate =
    parseDateKey(dateValue)

  if (!selectedDate) {
    return false
  }

  return selectedDate < TODAY
}

function createTimeSlots(
  startHour: number,
  endHour: number,
): TimeSlot[] {
  const slots: TimeSlot[] = []

  for (
    let minutes =
      startHour * 60;
    minutes <
      endHour * 60;
    minutes +=
      TIME_SLOT_INTERVAL_MINUTES
  ) {
    const hour =
      Math.floor(minutes / 60)

    const minute =
      minutes % 60

    slots.push({
      value: `${String(
        hour,
      ).padStart(2, '0')}:${String(
        minute,
      ).padStart(2, '0')}`,

      label: formatRange(
        `${String(
          hour,
        ).padStart(2, '0')}:${String(
          minute,
        ).padStart(2, '0')}`,
      ),
    })
  }

  return slots
}

function getCalendarDays(
  year: number,
  month: number,
): Date[] {
  const firstDay = new Date(
    year,
    month,
    1,
  )

  const lastDay = new Date(
    year,
    month + 1,
    0,
  )

  const firstWeekday =
    firstDay.getDay()

  const totalDays =
    lastDay.getDate()

  const previousMonthLastDay =
    new Date(
      year,
      month,
      0,
    ).getDate()

  const days: Date[] = []

  /**
   * Sunday = 0
   *
   * Add previous month's
   * trailing dates.
   */
  for (
    let index = firstWeekday - 1;
    index >= 0;
    index -= 1
  ) {
    days.push(
      new Date(
        year,
        month - 1,
        previousMonthLastDay -
          index,
      ),
    )
  }

  /**
   * Current month.
   */
  for (
    let day = 1;
    day <= totalDays;
    day += 1
  ) {
    days.push(
      new Date(
        year,
        month,
        day,
      ),
    )
  }

  /**
   * Complete the final week.
   */
  while (
    days.length % 7 !== 0
  ) {
    days.push(
      new Date(
        year,
        month,
        totalDays +
          (days.length -
            firstWeekday -
            totalDays) +
          1,
      ),
    )
  }

  return days
}

function getInitialCalendarDate(
  date: string,
): Date {
  const selected =
    parseDateKey(date)

  if (selected) {
    return selected
  }

  return new Date(TODAY)
}

function DateTimeStep({
  date,
  time,
  totalDuration,
  onChangeDate,
  onChangeTime,
  bookedTimes = [],
}: DateTimeStepProps) {
  const initialCalendarDate =
    getInitialCalendarDate(date)

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(
    initialCalendarDate.getMonth(),
  )

  const [
    calendarYear,
    setCalendarYear,
  ] = useState(
    initialCalendarDate.getFullYear(),
  )

  const timeGroups =
    useMemo<TimeGroup[]>(
      () => [
        {
          id: 'morning',
          title: 'Morning',
          description:
            'Start your day beautifully',
          icon: Sun,
          slots: createTimeSlots(
            9,
            12,
          ),
        },

        {
          id: 'afternoon',
          title: 'Afternoon',
          description:
            'Relaxed daytime appointments',
          icon: Sun,
          slots: createTimeSlots(
            12,
            16,
          ),
        },

        {
          id: 'evening',
          title: 'Evening',
          description:
            'Perfect for after-work appointments',
          icon: Sunset,
          slots: createTimeSlots(
            16,
            20,
          ),
        },

        {
          id: 'night',
          title: 'Night',
          description:
            'Later appointments available',
          icon: Moon,
          slots: createTimeSlots(
            20,
            BUSINESS_CLOSING_HOUR,
          ),
        },
      ],
      [],
    )

  const calendarDays =
    useMemo(
      () =>
        getCalendarDays(
          calendarYear,
          calendarMonth,
        ),
      [
        calendarMonth,
        calendarYear,
      ],
    )

  const minimumDate =
    getDateKey(TODAY)

  const monthLabel =
    new Date(
      calendarYear,
      calendarMonth,
      1,
    ).toLocaleDateString(
      'en-IN',
      {
        month: 'long',
        year: 'numeric',
      },
    )

  const canGoPreviousMonth =
    calendarYear >
      TODAY.getFullYear() ||
    (
      calendarYear ===
        TODAY.getFullYear() &&
      calendarMonth >
        TODAY.getMonth()
    )

  function goToPreviousMonth() {
    if (!canGoPreviousMonth) {
      return
    }

    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(
        (current) =>
          current - 1,
      )

      return
    }

    setCalendarMonth(
      (current) =>
        current - 1,
    )
  }

  function goToNextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(
        (current) =>
          current + 1,
      )

      return
    }

    setCalendarMonth(
      (current) =>
        current + 1,
    )
  }

  function handleDateChange(
    value: string,
  ) {
    if (
      !value ||
      isPastDate(value)
    ) {
      return
    }

    onChangeDate(value)

    /**
     * Date changed means the old
     * time selection is no longer
     * guaranteed to be valid.
     */
    onChangeTime('')

    const selected =
      parseDateKey(value)

    if (!selected) {
      return
    }

    setCalendarMonth(
      selected.getMonth(),
    )

    setCalendarYear(
      selected.getFullYear(),
    )
  }

  function handleToday() {
    const todayKey =
      getDateKey(TODAY)

    handleDateChange(
      todayKey,
    )
  }

  function isSlotBooked(
    slot: string,
  ): boolean {
    return bookedTimes.includes(
      slot,
    )
  }

  function isSlotInPast(
    slot: string,
  ): boolean {
    if (!date) {
      return false
    }

    if (!isToday(date)) {
      return false
    }

    return (
      getMinutesFromTime(
        slot,
      ) <=
      getCurrentTimeMinutes()
    )
  }

  function isSlotDisabled(
    slot: string,
  ): boolean {
    return (
      isSlotBooked(slot) ||
      isSlotInPast(slot)
    )
  }

  function selectTime(
    slot: string,
  ) {
    if (
      isSlotDisabled(slot)
    ) {
      return
    }

    onChangeTime(slot)
  }

  const selectedDateObject =
    parseDateKey(date)

  const selectedDateLabel =
    selectedDateObject
      ? selectedDateObject.toLocaleDateString(
          'en-IN',
          {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          },
        )
      : ''

  return (
    <section className="booking-panel booking-datetime-panel">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="booking-panel-heading">

        <div className="booking-step-label">
          STEP 03
        </div>

        <h2>
          Choose your
          <em> date & time.</em>
        </h2>

        <p>
          Select a convenient appointment
          date and available starting time.
        </p>

      </div>

      {/* =====================================================
          SELECTED DATE
      ===================================================== */}

      {date && (
        <div className="booking-selected-date">

          <div className="booking-selected-date-icon">
            <CalendarDays size={18} />
          </div>

          <div className="booking-selected-date-content">
            <span>
              SELECTED DATE
            </span>

            <strong>
              {selectedDateLabel}
            </strong>
          </div>

          {time && (
            <div className="booking-selected-time">
              <Clock3 size={15} />

              <span>
                {formatTime(time)}
              </span>
            </div>
          )}

        </div>
      )}

      {/* =====================================================
          CALENDAR
      ===================================================== */}

      <div className="booking-calendar">

        <div className="booking-calendar-header">

          <div>
            <span>
              APPOINTMENT DATE
            </span>

            <h3>
              {monthLabel}
            </h3>
          </div>

          <div className="booking-calendar-actions">

            <button
              type="button"
              aria-label="Previous month"
              className="booking-calendar-arrow"
              disabled={
                !canGoPreviousMonth
              }
              onClick={
                goToPreviousMonth
              }
            >
              <ChevronLeft
                size={17}
              />
            </button>

            <button
              type="button"
              aria-label="Next month"
              className="booking-calendar-arrow"
              onClick={
                goToNextMonth
              }
            >
              <ChevronRight
                size={17}
              />
            </button>

          </div>

        </div>

        <div className="booking-calendar-weekdays">

          {[
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
          ].map(
            (day) => (
              <span key={day}>
                {day}
              </span>
            ),
          )}

        </div>

        <div className="booking-calendar-grid">

          {calendarDays.map(
            (calendarDate) => {
              const value =
                getDateKey(
                  calendarDate,
                )

              const isCurrentMonth =
                calendarDate.getMonth() ===
                  calendarMonth &&
                calendarDate.getFullYear() ===
                  calendarYear

              const isSelected =
                value === date

              const isTodayDate =
                value ===
                minimumDate

              const disabled =
                calendarDate <
                  TODAY

              return (
                <button
                  type="button"
                  key={value}
                  disabled={disabled}
                  className={[
                    'booking-calendar-day',
                    isCurrentMonth
                      ? ''
                      : 'outside-month',
                    isSelected
                      ? 'selected'
                      : '',
                    isTodayDate
                      ? 'today'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() =>
                    handleDateChange(
                      value,
                    )
                  }
                >
                  <span>
                    {calendarDate.getDate()}
                  </span>

                  {isTodayDate && (
                    <small>
                      Today
                    </small>
                  )}
                </button>
              )
            },
          )}

        </div>

        <div className="booking-calendar-footer">

          <div className="booking-calendar-legend">

            <span>
              <i className="selected-dot" />
              Selected
            </span>

            <span>
              <i className="today-dot" />
              Today
            </span>

          </div>

          <button
            type="button"
            className="booking-today-button"
            onClick={handleToday}
          >
            Today
          </button>

        </div>

      </div>

      {/* =====================================================
          AVAILABLE TIME
      ===================================================== */}

      <div className="booking-time-section">

        <div className="booking-time-heading">

          <div>

            <Clock3 size={20} />

            <div>
              <strong>
                Available time
              </strong>

              <span>
                Choose your preferred
                starting time.
              </span>
            </div>

          </div>

          <span className="booking-duration-badge">
            {totalDuration ?? 0} min service
          </span>

        </div>

        {!date ? (
          <div className="booking-time-empty">

            <CalendarDays size={22} />

            <strong>
              Select a date first
            </strong>

            <span>
              Available starting times
              will appear here.
            </span>

          </div>
        ) : (
          <div className="booking-time-groups">

            {timeGroups.map(
              (group) => {
                const GroupIcon =
                  group.icon

                const availableSlots =
                  group.slots.filter(
                    (slot) =>
                      !isSlotInPast(
                        slot.value,
                      ),
                  )

                return (
                  <div
                    className="booking-time-group"
                    key={group.id}
                  >

                    <div className="booking-time-group-header">

                      <div className="booking-time-group-title">

                        <div className="booking-time-group-icon">
                          <GroupIcon
                            size={16}
                          />
                        </div>

                        <div>
                          <strong>
                            {group.title}
                          </strong>

                          <span>
                            {group.description}
                          </span>
                        </div>

                      </div>

                      <span className="booking-slot-count">
                        {availableSlots.length}{' '}
                        slots
                      </span>

                    </div>

                    <div className="booking-time-list">

                      {group.slots.map(
                        (slot) => {
                          const selected =
                            time ===
                            slot.value

                          const booked =
                            isSlotBooked(
                              slot.value,
                            )

                          const past =
                            isSlotInPast(
                              slot.value,
                            )

                          const disabled =
                            booked ||
                            past

                          return (
                            <button
                              type="button"
                              key={
                                slot.value
                              }
                              disabled={
                                disabled
                              }
                              aria-pressed={
                                selected
                              }
                              className={[
                                'booking-time-option',
                                selected
                                  ? 'active'
                                  : '',
                                booked
                                  ? 'booked'
                                  : '',
                                past
                                  ? 'past'
                                  : '',
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ' ',
                                )}
                              onClick={() =>
                                selectTime(
                                  slot.value,
                                )
                              }
                            >

                              <Clock3
                                size={16}
                              />

                              <span>
                                {slot.label}
                              </span>

                              {booked ? (
                                <small>
                                  Booked
                                </small>
                              ) : selected ? (
                                <span className="booking-time-check">
                                  <Check
                                    size={
                                      14
                                    }
                                  />
                                </span>
                              ) : null}

                            </button>
                          )
                        },
                      )}

                    </div>

                  </div>
                )
              },
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          BOOKING NOTE
      ===================================================== */}

      <div className="booking-time-note">

        <div className="booking-time-note-icon">
          <Clock3 size={15} />
        </div>

        <div>
          <strong>
            Starting time selection
          </strong>

          <span>
            Your service duration does not
            restrict the selected starting
            time. Final appointment
            confirmation is handled by the
            studio.
          </span>
        </div>

      </div>

      {date && time && (
        <div className="booking-time-confirmed">

          <div>
            <Check size={16} />
          </div>

          <span>
            {selectedDateLabel} at{' '}
            {formatTime(time)}
          </span>

        </div>
      )}

    </section>
  )
}

export default DateTimeStep