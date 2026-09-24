import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Award,
  ArrowRight,
  Flower2,
  Briefcase,
  Shirt,
  ShieldCheck,
  Building2,
  GraduationCap,
  Quote,
  CheckCircle2,
  Diamond,
  Layers,
  Crown
} from 'lucide-react'

import './About.css'

const About: React.FC = () => {
  return (
    <main className="about-page">
      {/* Background Ambient Glows */}
      <div className="ambient-glow glow-top"></div>
      <div className="ambient-glow glow-left"></div>
      <div className="ambient-glow glow-right"></div>

      {/* =====================================================
          HERO SECTION
      ===================================================== */}
      <section className="about-hero">
        <div className="about-hero-container">
          <div className="about-hero-grid">
            {/* Text Content Column */}
            <div className="about-hero-text">
              <div className="about-badge-pill">
                <span className="pulse-dot"></span>
                <span className="badge-text">About WildFloral</span>
              </div>

              <h1 className="about-hero-title">
                A Journey of{' '}
                <span className="italic-highlight">
                  Beauty, Fashion &amp; Creativity.
                </span>
              </h1>

              <p className="about-hero-description">
                WildFloral is built on a journey that brings together beauty
                therapy, business knowledge, fashion design, creativity, and a
                passion for creating meaningful experiences.
              </p>

              <div className="about-hero-actions">
                <Link to="/services" className="btn-primary-purple">
                  <span>Explore Our Services</span>
                  <ArrowRight size={18} className="btn-icon" />
                </Link>
                <Link to="/fashion" className="btn-secondary-glass">
                  <span>Discover Fashion</span>
                </Link>
              </div>

              {/* Trust & Credential Ribbon */}
              <div className="trust-ribbon">
                <div className="ribbon-item">
                  <Flower2 size={16} className="ribbon-icon" />
                  <span>Haute Couture &amp; Botanical Alchemy</span>
                </div>
                <span className="ribbon-bullet">•</span>
                <div className="ribbon-item">
                  <Award size={16} className="ribbon-icon" />
                  <span>State Level Honors</span>
                </div>
                <span className="ribbon-bullet">•</span>
                <div className="ribbon-item">
                  <Layers size={16} className="ribbon-icon" />
                  <span>Bespoke Craftsmanship</span>
                </div>
              </div>
            </div>

            {/* Visual Column / Card */}
            <div className="about-hero-visual">
              <div className="visual-card-wrapper">
                <div className="visual-glow-backdrop"></div>
                <div className="visual-card-frame">
                  <div className="visual-image-box">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80"
                      alt="Luxury Haute Couture & Beauty Editorial"
                      className="visual-img"
                    />
                    <div className="visual-overlay-gradient"></div>

                    {/* Editorial Badge Overlay */}
                    <div className="visual-badge-overlay">
                      <div className="badge-overlay-header">
                        <Flower2 size={16} className="text-purple-600" />
                        <span className="badge-overlay-tag">
                          Haute Couture &amp; Beauty
                        </span>
                      </div>
                      <h4 className="badge-overlay-title">
                        WildFloral Sanctuary
                      </h4>
                      <p className="badge-overlay-sub">
                        Botanical aesthetics &amp; bespoke tailoring handcrafted
                        with purpose.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 01: OUR STORY
      ===================================================== */}
      <section className="about-story-section">
        <div className="about-container">
          <div className="section-header-flex">
            <div>
              <div className="section-step-tag">
                <span className="step-num">01</span>
                <span className="step-title">Our Story</span>
              </div>
              <h2 className="section-main-heading">
                From a passion for beauty to a{' '}
                <span className="italic-highlight">vision for fashion.</span>
              </h2>
            </div>
            <p className="section-subtext-caps">
              The convergence of craftsmanship, intuition, and formal mastery.
            </p>
          </div>

          <div className="story-grid">
            {/* Main Narrative Box */}
            <div className="story-narrative-card">
              <div className="narrative-text-body">
                <p className="dropcap-paragraph">
                  <span className="dropcap">O</span>ur journey is rooted in
                  creativity, skill, and a genuine passion for beauty and
                  fashion. With a professional background in Beauty Therapy,
                  Business Administration, and Fashion &amp; Apparel Designing,
                  we bring together diverse expertise to create a unique and
                  evolving approach to the fashion and lifestyle industry.
                </p>
                <p className="secondary-paragraph">
                  What began with an interest in beauty developed into a broader
                  creative journey — combining professional skills, business
                  knowledge, design education, and entrepreneurial ambition.
                </p>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="metrics-bar">
                <div className="metric-col">
                  <span className="metric-val">3-Tier</span>
                  <span className="metric-lbl">Multidisciplinary</span>
                </div>
                <div className="metric-col">
                  <span className="metric-val text-accent">State</span>
                  <span className="metric-lbl">Level Excellence</span>
                </div>
                <div className="metric-col">
                  <span className="metric-val">100%</span>
                  <span className="metric-lbl">Bespoke Devotion</span>
                </div>
              </div>
            </div>

            {/* Archival Atelier Card */}
            <div className="story-accent-card">
              <img
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80"
                alt="Archival Fashion Atelier"
                className="accent-card-img"
              />
              <div className="accent-card-overlay"></div>
              <div className="accent-card-content">
                <span className="accent-tag-pill">Archival Philosophy</span>
                <h3 className="accent-card-title">
                  Where aesthetics meet purposeful execution.
                </h3>
                <p className="accent-card-sub">
                  Each garment and ritual is conceived as living art—harmonizing
                  human expression with botanical refinement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOUNDER JOURNEY TIMELINE
      ===================================================== */}
      <section className="founder-journey-section">
        <div className="about-container">
          <div className="timeline-header">
            <div className="about-badge-pill light-pill">
              <span className="badge-text">The Journey</span>
            </div>
            <h2 className="timeline-heading">
              Learning, growing &amp;{' '}
              <span className="italic-highlight">creating.</span>
            </h2>
            <p className="timeline-lead">
              Every stage of the journey has contributed to the person and the
              brand we are building today.
            </p>
          </div>

          <div className="timeline-wrapper">
            {/* Desktop Filament Line */}
            <div className="timeline-track-line"></div>
            <div className="timeline-track-glow"></div>

            <div className="timeline-cards-grid">
              {/* Stage 01 */}
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div className="node-number node-purple">
                    <span>01</span>
                  </div>
                  <span className="stage-pill">Origin</span>
                </div>
                <div className="stage-category">
                  <Flower2 size={15} />
                  <span>Beauty Therapy</span>
                </div>
                <h3 className="stage-title">The Beginning</h3>
                <p className="stage-desc">
                  The journey began with completing a Beautician Course and
                  developing a strong foundation in professional beauty care.
                </p>
                <div className="stage-footer">
                  <span className="stage-dot"></span>
                  <span>Foundation Era</span>
                </div>
              </div>

              {/* Stage 02 */}
              <div className="timeline-card offset-desktop">
                <div className="timeline-card-header">
                  <div className="node-number node-slate">
                    <span>02</span>
                  </div>
                  <span className="stage-pill">Commerce</span>
                </div>
                <div className="stage-category">
                  <Briefcase size={15} />
                  <span>Business Administration</span>
                </div>
                <h3 className="stage-title">Building Business Knowledge</h3>
                <p className="stage-desc">
                  While pursuing a Bachelor of Business Administration, the
                  founder continued developing professional skills and
                  exploring opportunities within the beauty industry.
                </p>
                <div className="stage-footer">
                  <span className="stage-dot secondary-dot"></span>
                  <span>Academic Rigor</span>
                </div>
              </div>

              {/* Stage 03 - Featured Crown Milestone */}
              <div className="timeline-card featured-crown-card">
                <div className="crown-glow-effect"></div>
                <div className="timeline-card-header z-relative">
                  <div className="node-number node-gold">
                    <span>03</span>
                  </div>
                  <div className="honors-badge-pill">
                    <Award size={13} />
                    <span>Honors</span>
                  </div>
                </div>
                <div className="stage-category z-relative">
                  <Crown size={15} />
                  <span>TN Skills Competition</span>
                </div>
                <h3 className="stage-title z-relative">
                  A Milestone in Beauty Therapy
                </h3>
                <p className="stage-desc z-relative">
                  The founder participated in the TN Skills Competition in Beauty
                  Therapy, progressing to the State Level and participating in
                  the competition held in Delhi. This journey was recognized
                  with a Participation Certificate from the Government of Tamil
                  Nadu.
                </p>

                <div className="gov-award-box z-relative">
                  <CheckCircle2 size={18} className="text-purple-600" />
                  <span>State Level Government Recognition</span>
                </div>
              </div>

              {/* Stage 04 */}
              <div className="timeline-card offset-desktop">
                <div className="timeline-card-header">
                  <div className="node-number node-slate">
                    <span>04</span>
                  </div>
                  <span className="stage-pill">Expansion</span>
                </div>
                <div className="stage-category">
                  <Shirt size={15} />
                  <span>Fashion &amp; Apparel Designing</span>
                </div>
                <h3 className="stage-title">Expanding Into Fashion</h3>
                <p className="stage-desc">
                  Driven by a passion for fashion and design, the founder pursued
                  a Post Graduate Diploma in Fashion and Apparel Designing,
                  developing knowledge in garment design, apparel development, and
                  creative craftsmanship.
                </p>
                <div className="stage-footer">
                  <span className="stage-dot"></span>
                  <span>Atelier Culmination</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 02: WHAT WE BRING (CORE PILLARS)
      ===================================================== */}
      <section className="about-pillars-section">
        <div className="about-container">
          <div className="section-header-flex">
            <div>
              <div className="section-step-tag">
                <span className="step-num">02</span>
                <span className="step-title">What We Bring</span>
              </div>
              <h2 className="section-main-heading">
                Three disciplines.{' '}
                <span className="italic-highlight">One elevated standard.</span>
              </h2>
            </div>
            <p className="section-subtext-regular">
              A trinity of distinct capabilities designed to transform personal
              presentation into an artform.
            </p>
          </div>

          <div className="pillars-grid">
            {/* Card 01 - Beauty */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <Flower2 size={26} />
              </div>
              <span className="pillar-sub-label">Core Discipline</span>
              <h3 className="pillar-title">Beauty</h3>
              <p className="pillar-desc">
                Professional beauty knowledge built through dedicated learning,
                practical experience, and a passion for helping people feel
                confident.
              </p>
              <div className="pillar-footer">
                <div className="pillar-progress-track">
                  <div className="progress-fill fill-75"></div>
                </div>
                <span className="pillar-tagline">
                  Skin Therapy • Holistic Wellness
                </span>
              </div>
            </div>

            {/* Card 02 - Fashion (Featured Centerpiece) */}
            <div className="pillar-card pillar-featured">
              <div className="featured-top-badge">Signature Focus</div>
              <div className="pillar-icon-box glass-icon">
                <Shirt size={26} />
              </div>
              <span className="pillar-sub-label light-sub">
                Creative Synthesis
              </span>
              <h3 className="pillar-title text-white">Fashion</h3>
              <p className="pillar-desc text-purple-100">
                Fashion and apparel design knowledge focused on thoughtful design,
                garment development, creativity, and personal style.
              </p>
              <div className="pillar-footer">
                <div className="pillar-progress-track track-light">
                  <div className="progress-fill fill-full"></div>
                </div>
                <span className="pillar-tagline text-purple-200">
                  Bespoke Tailoring • Apparel Design
                </span>
              </div>
            </div>

            {/* Card 03 - Business */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <Building2 size={26} />
              </div>
              <span className="pillar-sub-label">Strategic Grounding</span>
              <h3 className="pillar-title">Business</h3>
              <p className="pillar-desc">
                Business administration knowledge combined with an
                entrepreneurial mindset to build a purposeful and evolving
                brand.
              </p>
              <div className="pillar-footer">
                <div className="pillar-progress-track">
                  <div className="progress-fill fill-85"></div>
                </div>
                <span className="pillar-tagline">
                  Brand Governance • Client Experience
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BRAND VISION & SIGNATURE VALUES
      ===================================================== */}
      <section className="about-vision-section">
        <div className="about-container">
          <div className="vision-box-container">
            <div className="vision-grid">
              <div className="vision-text-col">
                <div className="about-badge-pill light-pill">
                  <span className="badge-text">Our Vision</span>
                </div>
                <h2 className="vision-heading">
                  Creating a brand with{' '}
                  <span className="italic-highlight">
                    purpose, personality &amp; elegance.
                  </span>
                </h2>
                <p className="vision-lead">
                  WildFloral is preparing to introduce its own clothing brand —
                  bringing together creative vision, garment craftsmanship, and an
                  appreciation for modern style. The focus is on designing
                  pieces that celebrate individuality, confidence, and timeless
                  contemporary design.
                </p>

                {/* Luxury Value Chips */}
                <div className="vision-chips-wrap">
                  <span className="value-chip">Creativity</span>
                  <span className="value-chip">Craftsmanship</span>
                  <span className="value-chip">Quality</span>
                  <span className="value-chip">Individuality</span>
                  <span className="value-chip highlight-chip">Elegance</span>
                </div>
              </div>

              {/* Visual Mosaic Column */}
              <div className="vision-visual-col">
                <div className="vision-img-frame">
                  <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
                    alt="WildFloral Luxury Fashion Silhouette"
                    className="vision-img"
                  />
                  <div className="vision-overlay"></div>
                  <div className="vision-card-float">
                    <span className="float-badge">Upcoming Release</span>
                    <span className="float-title">
                      The Debut Capsule Collection
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SECTION 03: FROM THE FOUNDER (QUOTE BLOCK)
      ===================================================== */}
      <section className="about-founder-quote-section">
        <div className="about-container-narrow">
          <div className="quote-tag-center">
            <div className="section-step-tag">
              <span className="step-num">03</span>
              <span className="step-title">From The Founder</span>
            </div>
          </div>

          <div className="quote-card-box">
            <div className="giant-quote-mark">“</div>
            <blockquote className="quote-statement">
              “My journey has always been about learning, creating, and turning
              passion into something meaningful.”
            </blockquote>
            <p className="quote-body">
              With a background spanning Beauty Therapy, Business Administration,
              and Fashion &amp; Apparel Designing, I am building WildFloral as a
              reflection of creativity, craftsmanship, entrepreneurship, and
              personal style.
            </p>

            <div className="founder-signature-block">
              <div className="signature-divider">
                <span className="sig-line"></span>
                <span className="sig-title">Founder, WildFloral</span>
                <span className="sig-line"></span>
              </div>
              <p className="sig-subtitle">Atelier Direction &amp; Design</p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CLOSING ATELIER INVITATION CTA
      ===================================================== */}
      <section className="about-cta-section">
        <div className="about-container-narrow text-center">
          <div className="about-badge-pill light-pill center-pill">
            <Diamond size={15} className="text-purple-600" />
            <span className="badge-text">Welcome to WildFloral</span>
          </div>

          <h2 className="closing-cta-heading">
            Beauty, fashion, and{' '}
            <span className="italic-highlight">your individuality.</span>
          </h2>

          <p className="closing-cta-sub">
            Explore our services and discover the fashion journey we are creating.
          </p>

          <div className="closing-cta-actions">
            <Link to="/services" className="btn-primary-purple large-btn">
              <span>Explore Services</span>
              <Sparkles size={18} className="btn-icon" />
            </Link>
            <Link to="/fashion" className="btn-secondary-glass large-btn">
              <span>Explore Fashion</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About