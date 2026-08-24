import HeroSection from '../../components/home/HeroSection'
import IntroSection from '../../components/home/IntroSection'
import ServicesSection from '../../components/home/ServicesSection'
import FashionSection from '../../components/home/FashionSection'
import PortfolioSection from '../../components/home/PortfolioSection'
import WhyChooseUs from '../../components/home/WhyChooseUs'
import TestimonialsSection from '../../components/home/TestimonialsSection'
import BookingCTA from '../../components/home/BookingCTA'

import './Home.css'

function Home() {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <FashionSection />
      <PortfolioSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <BookingCTA />
    </>
  )
}

export default Home