import { useEffect, useMemo, useState } from 'react';
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

const processSteps = [
  {
    number: '01',
    title: 'Set your commute',
    description: 'Choose the route and time that fit your working day.',
  },
  {
    number: '02',
    title: 'Meet your match',
    description: 'Connect with a verified colleague on a compatible route.',
  },
  {
    number: '03',
    title: 'Travel together',
    description: 'Follow the journey live and arrive with less friction.',
  },
];

const impactPreviews = [
  { identifier: 'traffic', title: 'Less Traffic', detail: 'Fewer single-rider vehicles on the road.' },
  { identifier: 'costs', title: 'Lower Costs', detail: 'Shared fares make daily travel easier to sustain.' },
  { identifier: 'together', title: 'More Together', detail: 'Commutes become trusted team routines.' },
  { identifier: 'teams', title: 'Trusted Teams', detail: 'Only verified workplace members participate.' },
  { identifier: 'visibility', title: 'Live Visibility', detail: 'Everyone can follow the active trip status.' },
  { identifier: 'footprint', title: 'Smaller Footprint', detail: 'Shared rides reduce avoidable fuel use.' },
];

const fallbackImpactPreview = impactPreviews[0]!;

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isPreloaderVisible, setIsPreloaderVisible] = useState(true);
  const [preloaderProgress, setPreloaderProgress] = useState(0);
  const [visibleStatisticValues, setVisibleStatisticValues] = useState(
    platformStatistics.map(() => 0)
  );
  const [activeImpactPreview, setActiveImpactPreview] = useState('traffic');

  const activeImpactDetail = useMemo(
    () =>
      impactPreviews.find(
        (impactPreview) => impactPreview.identifier === activeImpactPreview
      ) ?? fallbackImpactPreview,
    [activeImpactPreview]
  );

  useEffect(() => {
    const updateHeaderState = () => setIsHeaderScrolled(window.scrollY > 40);
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    return () => window.removeEventListener('scroll', updateHeaderState);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const startTime = performance.now();
    const minimumDuration = 1200;

    function renderPreloader(currentTime: number) {
      const progress = Math.min((currentTime - startTime) / minimumDuration, 1);
      setPreloaderProgress(progress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(renderPreloader);
        return;
      }

      window.setTimeout(() => setIsPreloaderVisible(false), 220);
    }

    animationFrame = window.requestAnimationFrame(renderPreloader);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const statisticsSection = document.querySelector('[data-marketing-statistics]');
    if (!statisticsSection) {
      setVisibleStatisticValues(platformStatistics.map((statistic) => statistic.value));
      return;
    }

    let animationFrame = 0;
    let animationStartTime = 0;

    function animateStatistics(currentTime: number) {
      if (animationStartTime === 0) {
        animationStartTime = currentTime;
      }
      const progress = Math.min((currentTime - animationStartTime) / 900, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setVisibleStatisticValues(
        platformStatistics.map((statistic) => Math.round(statistic.value * easedProgress))
      );

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animateStatistics);
      }
    }

    const statisticsObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animationFrame = window.requestAnimationFrame(animateStatistics);
          statisticsObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    statisticsObserver.observe(statisticsSection);
    return () => {
      statisticsObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="marketing-page">
      {isPreloaderVisible && (
        <div
          className={`marketing-preloader ${preloaderProgress >= 1 ? 'is-complete' : ''}`}
          role="progressbar"
          aria-label="Loading Raahi"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(preloaderProgress * 100)}
        >
          <div className="marketing-preloader-content">
            <p>Enterprise carpooling platform</p>
            <div className="marketing-preloader-wordmark" aria-hidden="true">
              <span>RAA</span>
              <span>HI</span>
              <i style={{ transform: `translateY(${110 - preloaderProgress * 130}px)` }} />
            </div>
            <div className="marketing-preloader-status">
              <span>LOADING</span>
              <span>{Math.round(preloaderProgress * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      <header className={`marketing-header ${isHeaderScrolled ? 'is-scrolled' : ''}`}>
        <nav className="marketing-navigation marketing-frame" aria-label="Main navigation">
          <a className="marketing-brand" href="#top" aria-label="Raahi home">
            <span className="marketing-brand-mark" aria-hidden="true">
              <img src="/assets/raahi-logo.png" alt="" />
            </span>
            <span className="marketing-brand-wordmark">
              <span>RAA</span><span>HI</span>
            </span>
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
              className="marketing-navigation-sign-in"
              to="/login"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign in
            </Link>
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

        <section className="marketing-statistics marketing-frame" aria-label="Raahi activity" data-marketing-statistics>
          {platformStatistics.map((statistic, statisticIndex) => (
            <article className="marketing-statistic-card" key={statistic.label}>
              <div className="marketing-statistic-value">
                <strong>{visibleStatisticValues[statisticIndex] ?? statistic.value}</strong><span aria-hidden="true">+</span>
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
            {processSteps.map((processStep) => (
              <article className="marketing-process-step" key={processStep.number}>
                <span>{processStep.number}</span>
                <h3>{processStep.title}</h3>
                <p>{processStep.description}</p>
              </article>
            ))}
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
          <div className="marketing-impact-stage">
            <div className="marketing-impact-words" aria-label="Raahi impact areas">
              {impactPreviews.map((impactPreview) => (
                <button
                  key={impactPreview.identifier}
                  type="button"
                  className={activeImpactPreview === impactPreview.identifier ? 'is-active' : ''}
                  onPointerEnter={() => setActiveImpactPreview(impactPreview.identifier)}
                  onFocus={() => setActiveImpactPreview(impactPreview.identifier)}
                >
                  {impactPreview.title.toUpperCase()}
                </button>
              ))}
            </div>
            <figure className="marketing-impact-preview-card">
              <figcaption>
                <span>{activeImpactDetail.title}</span>
                <span>RAAHI IMPACT</span>
              </figcaption>
              <div className={`marketing-impact-preview-visual ${activeImpactDetail.identifier}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>{activeImpactDetail.detail}</p>
            </figure>
            <p className="marketing-impact-side-label">FOR PEOPLE<br />FOR TEAMS</p>
            <p className="marketing-impact-summary">
              One shared journey creates a lighter routine for people,
              organizations, and the city around them.
            </p>
          </div>
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
        <div className="marketing-footer-main">
          <div className="marketing-footer-navigation-area">
            <p className="marketing-micro-label">EXPLORE RAAHI</p>
            <div className="marketing-footer-link-groups">
              <div>
                <span>PLATFORM</span>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
              </div>
              <div>
                <span>COMPANY</span>
                <a href="#impact">Why Raahi</a>
                <a href="#demo">Live view</a>
              </div>
            </div>
          </div>

          <div className="marketing-footer-contact-area">
            <p className="marketing-micro-label">LET'S TALK</p>
            <h2>Still have questions?</h2>
            <form className="marketing-footer-contact-form" action="mailto:hello@raahi.work" method="post">
              <label className="sr-only" htmlFor="footer-email">Your email address</label>
              <input id="footer-email" name="email" type="email" placeholder="Enter your email" autoComplete="email" required />
              <button className="marketing-footer-send-button" type="submit">Send</button>
              <button className="marketing-footer-arrow-button" type="submit" aria-label="Send email">-&gt;</button>
            </form>
          </div>
        </div>
        <div className="marketing-footer-wordmark" aria-hidden="true">
          <span>RAA</span><span>HI</span>
        </div>
        <div className="marketing-footer-bottom">
          <span>Copyright 2026 RAAHI. ALL RIGHTS RESERVED.</span>
          <div>
            <Link to="/login">ADMIN LOGIN</Link>
            <Link to="/register-organization">REGISTER</Link>
            <a href="mailto:hello@raahi.work">CONTACT</a>
          </div>
          <div className="marketing-footer-location">
            <span>BENGALURU / INDIA</span>
            <a className="marketing-footer-back-to-top" href="#top" aria-label="Back to top">UP</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
