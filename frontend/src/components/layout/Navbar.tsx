import { Link, NavLink } from 'react-router'
import './Navbar.css'

function Navbar() {
  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link to="/" className="brand">
          <span className="brand-name">WildFloral</span>
          <span className="brand-tagline">Beauty & Fashion</span>
        </Link>

        <nav className="main-navigation" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/fashion">Fashion</NavLink>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <Link to="/booking" className="header-book-button">
          Book Appointment
        </Link>
      </div>
    </header>
  )
}

export default Navbar