import './TestimonialsSection.css'

const testimonials = [
  {
    quote:
      'A beautiful experience from start to finish. Everything felt personal and thoughtfully done.',
    name: 'Client Story',
    service: 'Beauty Service',
  },
  {
    quote:
      'The attention to detail made the final look feel completely mine. I loved the result.',
    name: 'Client Story',
    service: 'Custom Fashion',
  },
  {
    quote:
      'Professional, comfortable, and exactly what I was hoping for. I would happily return.',
    name: 'Client Story',
    service: 'Bridal Beauty',
  },
]

function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-heading">
        <span className="section-eyebrow">KIND WORDS</span>

        <h2>
          Loved by women
          <em>who chose WildFloral.</em>
        </h2>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((testimonial, index) => (
          <article className="testimonial-card" key={index}>
            <span className="testimonial-mark">“</span>

            <blockquote>
              {testimonial.quote}
            </blockquote>

            <div>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.service}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default TestimonialsSection