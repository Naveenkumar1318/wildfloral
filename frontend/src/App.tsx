import { Route, Routes } from 'react-router'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import Services from './pages/Services/Services'
import Fashion from './pages/Fashion/Fashion'
import Portfolio from './pages/Portfolio/Portfolio'
import Contact from './pages/Contact/Contact'
import Booking from './pages/Booking/Booking'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/fashion" element={<Fashion />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/booking" element={<Booking />} />
      </Route>
    </Routes>
  )
}

export default App