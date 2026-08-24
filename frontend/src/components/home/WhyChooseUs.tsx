import './WhyChooseUs.css'

const reasons = [
  {
    number: '01',
    title: 'Personal Attention',
    text: 'Every appointment is focused on understanding your preferences and creating a result that feels like you.',
  },
  {
    number: '02',
    title: 'Beauty & Fashion',
    text: 'One place for professional beauty care and custom fashion designed around your occasion and personality.',
  },
  {
    number: '03',
    title: 'Crafted With Care',
    text: 'From beauty details to hand-finished Aari work, we value patience, precision, and quality.',
  },
  {
    number: '04',
    title: 'Simple Booking',
    text: 'Choose your service, select an available time, and request your appointment with ease.',
  },
]

function WhyChooseUs() {
  return (
    <section className="why-section">
      <div className="why-heading">
        <span className="section-eyebrow">WHY WILDFLORAL</span>

        <h2>
          Thoughtful service.
          <em>Beautiful results.</em>
        </h2>
      </div>

      <div className="why-grid">
        {reasons.map((reason) => (
          <article className="why-card" key={reason.number}>
            <span>{reason.number}</span>
            <h3>{reason.title}</h3>
            <p>{reason.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WhyChooseUs