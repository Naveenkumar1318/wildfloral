import type { ReactNode, KeyboardEvent } from 'react'

import './CatalogueCard.css'

export type CatalogueCardAction = {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

export type CatalogueCardProps = {
  /* Image */
  image?: string | null
  imageAlt?: string

  /* Main content */
  label?: string
  title: string
  description?: string | null

  /* Optional information */
  meta?: ReactNode
  price?: ReactNode
  duration?: ReactNode

  /* Status */
  status?: string
  statusType?: 'active' | 'inactive'

  /* Optional action button in image */
  imageAction?: ReactNode

  /* Bottom actions */
  actions?: CatalogueCardAction[]

  /* Custom footer */
  footer?: ReactNode

  /* Whole card click */
  onCardClick?: () => void

  /* Extra class */
  className?: string
}

function CatalogueCard({
  image,
  imageAlt,
  label,
  title,
  description,
  meta,
  price,
  duration,
  status,
  statusType = 'active',
  imageAction,
  actions = [],
  footer,
  onCardClick,
  className = '',
}: CatalogueCardProps) {
  const hasImage = Boolean(image)

  const cardClassName = [
    'catalogue-card',
    onCardClick
      ? 'catalogue-card-clickable'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (!onCardClick) {
      return
    }

    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      onCardClick()
    }
  }

  return (
    <article
      className={cardClassName}
      onClick={onCardClick}
      onKeyDown={handleCardKeyDown}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
    >
      {/* =====================================================
          IMAGE
      ===================================================== */}

      <div className="catalogue-card-image">
        {hasImage ? (
          <img
            src={image ?? ''}
            alt={imageAlt ?? title}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="catalogue-card-image-placeholder">
            <span>
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {label && (
          <span className="catalogue-card-image-label">
            {label}
          </span>
        )}

        {status && (
          <span
            className={[
              'catalogue-card-status',
              statusType === 'inactive'
                ? 'inactive'
                : 'active',
            ].join(' ')}
          >
            <span className="catalogue-card-status-dot" />
            {status}
          </span>
        )}

        {imageAction && (
          <div
            className="catalogue-card-image-action"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {imageAction}
          </div>
        )}
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="catalogue-card-body">
        <div className="catalogue-card-content">
          {label && (
            <span className="catalogue-card-label">
              {label}
            </span>
          )}

          <h3 className="catalogue-card-title">
            {title}
          </h3>

          {description && (
            <p className="catalogue-card-description">
              {description}
            </p>
          )}

          {meta && (
            <div className="catalogue-card-meta">
              {meta}
            </div>
          )}

          {(price || duration) && (
            <div className="catalogue-card-details">
              {price && (
                <div className="catalogue-card-price">
                  <span className="catalogue-card-detail-label">
                    Starting from
                  </span>

                  <strong>
                    {price}
                  </strong>
                </div>
              )}

              {duration && (
                <div className="catalogue-card-duration">
                  <span className="catalogue-card-duration-icon">
                    ◷
                  </span>

                  <span>
                    {duration}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        {(footer || actions.length > 0) && (
          <div
            className="catalogue-card-footer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {footer && (
              <div className="catalogue-card-footer-meta">
                {footer}
              </div>
            )}

            {actions.length > 0 && (
              <div className="catalogue-card-actions">
                {actions.map(
                  (action, index) => (
                    <button
                      key={`${action.label}-${index}`}
                      type="button"
                      className={[
                        'catalogue-card-action',
                        `catalogue-card-action-${
                          action.variant ??
                          'secondary'
                        }`,
                      ].join(' ')}
                      onClick={
                        action.onClick
                      }
                      disabled={
                        action.disabled
                      }
                    >
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default CatalogueCard