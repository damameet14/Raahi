import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const platformStatistics = [
  { value: 48, label: 'Employees onboarded' },
  { value: 163, label: 'Shared rides this month' },
  { value: 22, label: 'Vehicles registered' },
];

const platformFeatures = [
  {
    number: '01',
    title: 'Smart Matching',
    description: 'Bring verified colleagues with compatible routes together.',
    icon: '⌖',
  },
  {
    number: '02',
    title: 'Trusted Teams',
    description: 'Keep every shared commute inside your verified workplace community.',
    icon: '→',
  },
  {
    number: '03',
    title: 'Live Visibility',
    description: 'Track trip progress, vehicles, participation, and arrival updates.',
    icon: '◎',
  },
];

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const updateHeaderState = () => setIsHeaderScrolled(window.scrollY > 40);
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    return () => window.removeEventListener('scroll', updateHeaderState);
  }, []);

  return (
    <div className="marketing-page">
      <header className={`marketing-header ${isHeaderScrolled ? 'is-scrolled' : ''}`}>
        <nav className="marketing-navigation marketing-frame" aria-label="Main navigation">
          <a className="marketing-brand" href="#top" aria-label="Raahi home">
            <span className="marketing-brand-mark" aria-hidden="true">R</span>
            <span>Raahi</span>
          </a>

          <button
            className="marketing-menu-toggle"
            type="button"
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-controls="marketing-navigation-menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          >
            <span />
            <span />
          </button>

          <div
            className={`marketing-navigation-grid ${isMenuOpen ? 'is-open' : ''}`}
            id="marketing-navigation-menu"
          >
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Platform</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it works</a>
            <a href="#demo" onClick={() => setIsMenuOpen(false)}>Live tracking</a>
            <a href="#impact" onClick={() => setIsMenuOpen(false)}>Impact</a>
            <Link
              className="marketing-navigation-call-to-action"
              to="/register-organization"
              onClick={() => setIsMenuOpen(false)}
            >
              Let&apos;s commute!
            </Link>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="marketing-hero marketing-frame" aria-labelledby="hero-title">
          <div className="marketing-hero-meta">
            <p>Enterprise carpooling platform</p>
            <p>Built for teams.<br />For every commute.</p>
          </div>

          <div className="marketing-hero-display" aria-hidden="true">
            <span>RAA</span><span className="marketing-accent-text">HI</span>
          </div>

          <div className="marketing-hero-content">
            <h1 id="hero-title">Share the road.<br />Change the routine.</h1>
            <div className="marketing-hero-introduction">
              <p>
                Find trusted colleagues heading your way, offer an empty seat,
                and keep every shared journey visible in real time.
              </p>
              <div className="marketing-hero-actions">
                <Link className="marketing-button marketing-button-primary" to="/register-organization">
                  Let&apos;s commute <span>↗</span>
                </Link>
                <a className="marketing-text-link" href="#how-it-works">See how it works <span>↓</span></a>
              </div>
            </div>
          </div>

          <div className="marketing-hero-corner-label" aria-hidden="true">RAAHI / 2026</div>
        </section>

        <section className="marketing-statistics marketing-frame" aria-label="Raahi activity">
          {platformStatistics.map((statistic) => (
            <article className="marketing-statistic-card" key={statistic.label}>
              <div className="marketing-statistic-value">
                <strong>{statistic.value}</strong><span aria-hidden="true">+</span>
              </div>
              <span className="marketing-statistic-label">{statistic.label}</span>
            </article>
          ))}
          <div className="marketing-statistics-message">
            <span>RAAHI IN MOTION</span>
            <p>Less traffic.<br /><strong>More together.</strong></p>
          </div>
        </section>

        <section className="marketing-section marketing-frame" id="features" aria-labelledby="features-title">
          <div className="marketing-section-index">
            <span>01 / PLATFORM</span>
            <span>Everything in one place</span>
          </div>
          <div className="marketing-section-heading">
            <h2 id="features-title">Everything you need<br />to <span>share your ride.</span></h2>
            <p>
              A calmer commute starts with simple tools, trusted people,
              and a route that works for everyone.
            </p>
          </div>

          <div className="marketing-feature-grid">
            {platformFeatures.map((feature) => (
              <article className="marketing-feature-card" key={feature.title}>
                <div className="marketing-feature-card-top">
                  <span>{feature.number}</span>
                  <span className="marketing-feature-icon" aria-hidden="true">{feature.icon}</span>
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <a href="#demo">Explore <span>↗</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section marketing-frame" id="how-it-works" aria-labelledby="process-title">
          <div className="marketing-section-index">
            <span>02 / THE ROUTE</span>
            <span>Three quiet steps</span>
          </div>
          <div className="marketing-process-introduction">
            <h2 id="process-title">How it <span>works.</span></h2>
            <p>Three simple moments turn an everyday route into a calmer, shared commute.</p>
          </div>
          <div className="marketing-process-timeline">
            <article className="marketing-process-step">
              <span>01</span><h3>Register your company</h3><p>Create the workplace tenant and admin account.</p>
            </article>
            <article className="marketing-process-step">
              <span>02</span><h3>Set your commute rules</h3><p>Configure costs, office location, vehicles, and employee access.</p>
            </article>
            <article className="marketing-process-step">
              <span>03</span><h3>Travel together</h3><p>Give employees a trusted place to share verified workplace rides.</p>
            </article>
          </div>
        </section>

        <section className="marketing-section marketing-frame" id="demo" aria-labelledby="demo-title">
          <div className="marketing-section-index">
            <span>03 / LIVE VIEW</span>
            <span>Clarity in motion</span>
          </div>
          <div className="marketing-section-heading">
            <h2 id="demo-title">See every journey<br /><span>in action.</span></h2>
            <p>One clear view for team journeys, trusted colleagues, pickup details, and real-time progress.</p>
          </div>

          <div className="marketing-application-window">
            <div className="marketing-application-toolbar">
              <div className="marketing-toolbar-dots" aria-hidden="true"><i /><i /><i /></div>
              <span>APP.RAAHI.WORK / COMMUTE OVERVIEW</span>
              <span>LIVE</span>
            </div>
            <div className="marketing-application-layout">
              <aside className="marketing-application-sidebar">
                <span className="marketing-application-logo">R</span>
                <span className="marketing-application-link is-active">⌖ <span>Overview</span></span>
                <span className="marketing-application-link">→ <span>Team routes</span></span>
                <span className="marketing-application-link">◎ <span>Reports</span></span>
                <span className="marketing-application-profile">NK</span>
              </aside>
              <div className="marketing-application-content">
                <div className="marketing-application-welcome">
                  <div>
                    <small>GOOD MORNING, NAMRA</small>
                    <h3>Today&apos;s commute</h3>
                  </div>
                  <span className="marketing-live-badge"><i /> 163 RIDES THIS MONTH</span>
                </div>
                <div className="marketing-ride-search">
                  <label><span>FROM</span><strong>Koramangala</strong></label>
                  <span aria-hidden="true">⇄</span>
                  <label><span>TO</span><strong>Embassy Tech Village</strong></label>
                  <button type="button">Search</button>
                </div>
                <div className="marketing-rides-and-map">
                  <div className="marketing-available-rides">
                    <div className="marketing-available-rides-title"><strong>Team journeys</strong><span>12 ACTIVE</span></div>
                    <article className="marketing-ride-result"><span>AS</span><div><strong>Aarav Shah</strong><small>Koramangala → Bellandur</small></div><div><strong>8:30 AM</strong><small>2 seats</small></div></article>
                    <article className="marketing-ride-result"><span>MR</span><div><strong>Meera Rao</strong><small>Indiranagar → Bellandur</small></div><div><strong>8:45 AM</strong><small>1 seat</small></div></article>
                    <article className="marketing-ride-result"><span>VK</span><div><strong>Vikram Kumar</strong><small>HSR Layout → Bellandur</small></div><div><strong>9:00 AM</strong><small>3 seats</small></div></article>
                  </div>
                  <div className="marketing-route-map" aria-label="Route map from Koramangala to Tech Village">
                    <span className="marketing-map-street one" /><span className="marketing-map-street two" /><span className="marketing-map-street three" />
                    <span className="marketing-map-route" /><span className="marketing-map-point start" /><span className="marketing-map-point end" />
                    <small className="marketing-map-label start">KORAMANGALA</small><small className="marketing-map-label end">TECH VILLAGE</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-impact-section marketing-frame" id="impact">
          <div className="marketing-impact-header">
            <span>04 / WHY RAAHI</span>
            <span>BUILT FOR BETTER COMMUTES</span>
            <span>RAAHI / 2026</span>
          </div>
          <div className="marketing-impact-words" aria-label="Raahi impact areas">
            <span>LESS TRAFFIC</span><span>LOWER COSTS</span><span>MORE TOGETHER</span>
            <span>TRUSTED TEAMS</span><span>LIVE VISIBILITY</span><span>SMALLER FOOTPRINT</span>
          </div>
          <p className="marketing-impact-summary">
            One shared journey creates a lighter routine for people,
            organizations, and the city around them.
          </p>
        </section>

        <section className="marketing-call-to-action marketing-frame">
          <div>
            <p className="marketing-micro-label">THE NEXT RIDE STARTS HERE</p>
            <h2>Ready to make your<br />commute better?</h2>
          </div>
          <Link className="marketing-button marketing-button-primary marketing-button-large" to="/register-organization">
            Let&apos;s commute <span>↗</span>
          </Link>
        </section>
      </main>

      <footer className="marketing-footer marketing-frame">
        <div className="marketing-footer-top">
          <div>
            <p className="marketing-micro-label">SHARE YOUR COMMUTE</p>
            <p>Cut costs. Cut emissions.<br />Make the journey better.</p>
          </div>
          <Link className="marketing-footer-circle-link" to="/register-organization" aria-label="Register organization">↗</Link>
        </div>
        <div className="marketing-footer-wordmark" aria-hidden="true">RAAHI</div>
        <div className="marketing-footer-bottom">
          <span>© 2026 RAAHI</span>
          <Link to="/login">ADMIN LOGIN</Link>
          <span>BENGALURU / INDIA</span>
        </div>
      </footer>
    </div>
  );
}
