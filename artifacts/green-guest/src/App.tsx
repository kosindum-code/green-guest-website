import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

type ModalName = 'reserve' | 'dashboard' | 'lightbox' | null;

type Enquiry = {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  contact: string;
  note: string;
};

type FormState = Omit<Enquiry, 'id' | 'createdAt' | 'status'>;

const queryClient = new QueryClient();
const STORAGE_KEY = 'green_guest_enquiries';
const WHATSAPP_NUMBER = '94775592762';
const imageUrls = {
  exterior: 'https://i.postimg.cc/qMHmYmwx/Whats-App-Image-2026-02-11-at-14-05-54.jpg.jpeg',
  bedroom: 'https://i.postimg.cc/25kNf9SB/Whats-App-Image-2026-02-11-at-14-05-29.jpg.jpeg',
  waterfall: `${import.meta.env.BASE_URL}images/hero-waterfall.webp`,
  mountain: 'https://i.postimg.cc/90HQy52Q/Whats-App-Image-2026-02-11-at-14-06-31.jpg.jpeg',
  outdoor: 'https://i.postimg.cc/B6qFHKB2/Whats-App-Image-2026-02-11-at-21-21-28.jpg.jpeg',
  living: 'https://i.postimg.cc/yxVLDt2p/Whats-App-Image-2026-02-11-at-14-05-31.jpg.jpeg',
  garden: 'https://i.postimg.cc/gJkwnPYb/Whats-App-Image-2026-02-11-at-14-06-18.jpg.jpeg',
  townView: `${import.meta.env.BASE_URL}gallery/nuwara-eliya-view.png`,
  teaCountry: `${import.meta.env.BASE_URL}gallery/tea-country.png`,
  kitchen: `${import.meta.env.BASE_URL}gallery/kitchen.png`,
  blueBedroom: `${import.meta.env.BASE_URL}gallery/bedroom-blue.jpeg`,
  floralBedroom: `${import.meta.env.BASE_URL}gallery/bedroom-floral.jpeg`,
  bathroom: `${import.meta.env.BASE_URL}gallery/bathroom.png`,
};

const galleryImages = [
  { src: imageUrls.exterior, alt: 'The villa exterior surrounded by highland greenery', category: 'outdoor', label: 'The house' },
  { src: imageUrls.bedroom, alt: 'A quiet, elegant bedroom', category: 'indoor', label: 'Bedroom' },
  { src: imageUrls.outdoor, alt: 'A view across the hills', category: 'outdoor', label: 'The view' },
  { src: imageUrls.living, alt: 'The villa living space', category: 'indoor', label: 'Living room' },
  { src: imageUrls.garden, alt: 'Green garden around the villa', category: 'outdoor', label: 'Garden' },
  { src: imageUrls.townView, alt: 'A wide view across Nuwara Eliya town', category: 'outdoor', label: 'Nuwara Eliya view' },
  { src: imageUrls.teaCountry, alt: 'Bright green tea country in the hills', category: 'outdoor', label: 'Tea country' },
  { src: imageUrls.kitchen, alt: 'The villa kitchen with cooking facilities', category: 'indoor', label: 'Kitchen' },
  { src: imageUrls.blueBedroom, alt: 'Blue and white bedroom with two beds', category: 'indoor', label: 'Blue bedroom' },
  { src: imageUrls.floralBedroom, alt: 'Comfortable floral bedroom with two beds', category: 'indoor', label: 'Floral bedroom' },
  { src: imageUrls.bathroom, alt: 'Villa bathroom with basin and mirror', category: 'indoor', label: 'Bathroom' },
];

const initialForm: FormState = {
  name: '',
  phone: '',
  checkIn: '',
  checkOut: '',
  guests: '1–3 adults',
  contact: 'WhatsApp',
  note: '',
};

function readEnquiries(): Enquiry[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Enquiry[] : [];
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  if (!value) return 'Date to be confirmed';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'outdoor' | 'indoor'>('all');
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const visibleImages = useMemo(
    () => galleryImages.filter((image) => filter === 'all' || image.category === filter),
    [filter],
  );
  const lightboxImage = visibleImages[lightboxIndex] ?? visibleImages[0];

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 },
    );
    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', modal !== null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (modal === 'lightbox' && event.key === 'ArrowRight') setLightboxIndex((current) => (current + 1) % visibleImages.length);
      if (modal === 'lightbox' && event.key === 'ArrowLeft') setLightboxIndex((current) => (current - 1 + visibleImages.length) % visibleImages.length);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [modal, visibleImages.length]);

  const openReserve = () => {
    setFormError('');
    setSubmitted(false);
    setModal('reserve');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      setFormError('Please choose a check-out date after your check-in date.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.checkIn || !form.checkOut) {
      setFormError('Please complete your name, phone number and preferred dates.');
      return;
    }
    const entry: Enquiry = {
      ...form,
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      status: 'New',
    };
    const next = [entry, ...readEnquiries()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const message = [
      'Hello The Green Guest,',
      '',
      `I would like to enquire about a stay.`,
      `Name: ${entry.name}`,
      `Phone / WhatsApp: ${entry.phone}`,
      `Check-in: ${formatDate(entry.checkIn)}`,
      `Check-out: ${formatDate(entry.checkOut)}`,
      `Adults: ${entry.guests}`,
      entry.note ? `Note: ${entry.note}` : '',
    ].filter(Boolean).join('\n');
    const nextWhatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    setEnquiries(next);
    setWhatsappUrl(nextWhatsappUrl);
    setSubmitted(true);
    setForm(initialForm);
    window.open(nextWhatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const openDashboard = () => {
    setEnquiries(readEnquiries());
    setModal('dashboard');
  };

  const clearEnquiries = () => {
    if (window.confirm('Delete all saved enquiries from this browser?')) {
      window.localStorage.removeItem(STORAGE_KEY);
      setEnquiries([]);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setModal('lightbox');
  };

  const setGalleryFilter = (nextFilter: 'all' | 'outdoor' | 'indoor') => {
    setFilter(nextFilter);
    setLightboxIndex(0);
  };

  return (
    <div className="site">
      <header className={`header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="wrap nav">
          <a className="brand" href="#home" data-testid="link-home">
            <span className="brand-mark">G</span>
            <span className="brand-name">The Green Guest <span className="brand-place">Nuwara Eliya</span></span>
          </a>
          <nav className={`nav-links ${mobileOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            <a href="#experience" onClick={() => setMobileOpen(false)} data-testid="link-experience">Experience</a>
            <a href="#gallery" onClick={() => setMobileOpen(false)} data-testid="link-gallery">Gallery</a>
            <a href="#stay" onClick={() => setMobileOpen(false)} data-testid="link-stay">The stay</a>
            <a href="#location" onClick={() => setMobileOpen(false)} data-testid="link-location">Location</a>
          </nav>
          <button className="nav-cta" onClick={openReserve} data-testid="button-header-enquiry">Reserve your stay <ArrowUpRight size={14} /></button>
          <button className="menu-btn" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>

      <main>
        <section
          className="hero"
          id="home"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(4,20,14,.78), rgba(7,24,17,.22) 62%, rgba(7,24,17,.04)), url(${imageUrls.waterfall})`,
          }}
        >
          <div className="wrap hero-content reveal is-visible">
            <div className="hero-kicker">A private villa <span aria-hidden="true">·</span> Nuwara Eliya, Sri Lanka</div>
            <h1><span className="hero-title-main">Luxury,</span><em>surrounded by green.</em></h1>
              <p className="hero-description">Wake up to mountain mist, waterfall air and the quiet luxury of a home made for slow, unforgettable days.</p>
            <div className="hero-actions">
              <button className="btn btn-gold" onClick={openReserve} data-testid="button-hero-enquiry">Check availability <ArrowUpRight size={15} /></button>
              <a className="btn btn-ghost" href="#experience" data-testid="link-explore-villa">Explore the villa <ArrowDown size={15} /></a>
            </div>
          </div>
          <div className="hero-scroll">Scroll to discover</div>
        </section>

        <section className="booking-strip wrap reveal is-visible" aria-label="Stay details">
          <div className="booking-field"><label>Location</label><strong>Nuwara Eliya</strong><small>Central Province, Sri Lanka</small></div>
          <div className="booking-field"><label>Villa style</label><strong>Private residence</strong><small>Exclusive to your group</small></div>
          <div className="booking-field"><label>Capacity</label><strong>Up to 11 adults</strong><small>3 bedrooms · private villa</small></div>
          <div className="booking-field"><button onClick={openReserve} data-testid="button-strip-enquiry">Make an enquiry <ArrowUpRight size={15} /></button></div>
        </section>

        <section className="intro" id="experience">
          <div className="wrap intro-grid">
            <div className="intro-art reveal">
              <img src={imageUrls.exterior} alt="The Green Guest villa exterior surrounded by greenery" loading="lazy" />
              <div className="intro-stamp">A slower<br />kind of luxury</div>
            </div>
            <div className="intro-copy reveal">
              <span className="eyebrow">Welcome to your escape</span>
              <h2 className="display">Stay close to nature.<br /><em>Stay close to yourself.</em></h2>
              <p className="copy">Tucked into the cool highlands of Nuwara Eliya, The Green Guest is a private retreat for people who appreciate space, stillness and thoughtful comfort. Spend your mornings with a cup of tea, your afternoons by the waterfall, and your evenings in the warmth of your own home.</p>
              <a className="btn btn-gold" href="#stay" data-testid="link-discover-stay">Discover the stay <ArrowUpRight size={15} /></a>
              <div className="signature">The Green Guest <span>— Nuwara Eliya</span></div>
            </div>
          </div>
        </section>

        <section className="feature-band" id="stay">
          <div className="wrap">
            <div className="band-head reveal">
              <div><span className="eyebrow">Your private retreat</span><h2 className="display">Every room has<br /><em>a story to tell.</em></h2></div>
              <p className="copy">From crisp mountain air to carefully considered interiors, everything here is made for a stay you will remember.</p>
            </div>
              <div className="feature-grid">
                <article className="feature-card waterfall-feature reveal"><img src={imageUrls.waterfall} alt="Lover's Leap Waterfall near the villa" loading="lazy" /><div className="feature-content"><span className="feature-index">01 — The signature experience</span><h3>Lover’s Leap</h3><p>Follow the sound of water into one of Nuwara Eliya’s most beautiful escapes.</p></div></article>
                <article className="feature-card reveal"><img src={imageUrls.blueBedroom} alt="Blue and white bedroom interior" loading="lazy" /><div className="feature-content"><span className="feature-index">02 — Interiors</span><h3>Thoughtful comfort</h3><p>Three bedrooms made for relaxed group stays.</p></div></article>
                <article className="feature-card reveal"><img src={imageUrls.teaCountry} alt="Green tea country in the hills" loading="lazy" /><div className="feature-content"><span className="feature-index">03 — Outdoors</span><h3>Misty mornings</h3><p>Tea country, mountain air and slow highland days.</p></div></article>
              </div>
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="wrap">
            <div className="gallery-head reveal">
              <div><span className="eyebrow">Take a closer look</span><h2 className="display">A home with<br /><em>room to breathe.</em></h2></div>
              <div className="gallery-tabs" role="tablist" aria-label="Gallery filters">
                {(['all', 'outdoor', 'indoor'] as const).map((tab) => (
                  <button key={tab} className={`tab ${filter === tab ? 'active' : ''}`} onClick={() => setGalleryFilter(tab)} role="tab" aria-selected={filter === tab} data-testid={`button-gallery-${tab}`}>
                    {tab === 'all' ? 'All spaces' : tab === 'outdoor' ? 'Outdoors' : 'Interiors'}
                  </button>
                ))}
              </div>
            </div>
            <div className="gallery-grid reveal">
              {visibleImages.map((image, index) => (
                <button className="gallery-item" key={image.src} onClick={() => openLightbox(index)} aria-label={`Open ${image.label}`} data-testid={`button-gallery-image-${index}`}>
                  <img src={image.src} alt={image.alt} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="details">
          <div className="wrap details-grid">
            <div className="reveal">
              <span className="eyebrow">Made for living well</span>
              <h2 className="display">Everything you need.<br /><em>Nothing you don’t.</em></h2>
              <p className="copy">A considered private residence with the space and flexibility to make every day your own.</p>
              <div className="amenities">
                {['Up to 11 adults', '03 comfortable bedrooms', 'Modern bathrooms', 'Fully equipped kitchen', 'Spacious living area', 'Waterfall nearby'].map((amenity) => <div className="amenity" key={amenity}>{amenity}</div>)}
              </div>
            </div>
            <div className="quote-card reveal">
              <blockquote>“Spend an unforgettable wellness vacation with the joy of nature and the enchanting beauty of the waterfall.”</blockquote>
              <cite>The Green Guest · Nuwara Eliya</cite>
            </div>
          </div>
        </section>

        <section className="location" id="location">
          <div className="wrap location-grid">
            <div className="reveal">
              <span className="eyebrow">Find your way here</span>
              <h2 className="display">The hills are<br /><em>calling.</em></h2>
              <p className="copy">Set in the cool, green heart of Nuwara Eliya, the villa gives you a peaceful base for waterfall walks, tea country and slow highland days.</p>
              <div className="distance-list">
                <div className="distance"><span>Lover’s Leap Waterfall</span><b>Nearby</b></div>
                <div className="distance"><span>Nuwara Eliya town</span><b>Short drive</b></div>
                <div className="distance"><span>Tea country</span><b>All around you</b></div>
              </div>
            </div>
            <div className="location-map reveal">
              <iframe title="Map showing Lover's Leap Waterfall" loading="lazy" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.2974378906666!2d80.78768227448375!3d6.974199917758362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae3817187474d71%3A0x4f61d826176d6317!2sLover%27s%20Leap%20Waterfall!5e0!3m2!1sen!2slk!4v1707663456789!5m2!1sen!2slk" />
              <div className="location-note"><strong>Lover’s Leap</strong>Waterfall, Nuwara Eliya</div>
            </div>
          </div>
        </section>

        <section
          className="cta-section"
          id="reserve"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(5,22,15,.93), rgba(5,22,15,.56)), url(${imageUrls.teaCountry})`,
          }}
        >
          <div className="wrap reveal">
            <span className="eyebrow">Your next chapter starts here</span>
            <h2 className="display">Make space for<br /><em>something beautiful.</em></h2>
            <p className="copy">Tell us when you would like to arrive. We will get back to you with availability and details.</p>
            <button className="btn btn-gold" onClick={openReserve} data-testid="button-final-enquiry">Enquire about your stay <ArrowUpRight size={15} /></button>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap footer-row">
          <small>© 2026 The Green Guest Nuwara Eliya</small>
          <div className="footer-links">
            <a href="tel:+94775592762" data-testid="link-phone">+94 77 559 2762</a>
            <a href="https://wa.me/94775592762" target="_blank" rel="noopener noreferrer" data-testid="link-whatsapp">WhatsApp</a>
            <button className="dashboard-link" onClick={openDashboard} data-testid="button-owner-dashboard">Owner dashboard</button>
          </div>
        </div>
      </footer>

      <div className={`modal ${modal === 'reserve' ? 'open' : ''}`} aria-hidden={modal !== 'reserve'}>
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
          <button className="modal-close" onClick={() => setModal(null)} aria-label="Close enquiry form" data-testid="button-close-reserve"><X size={21} /></button>
          <h2 id="reserve-title">Plan your escape.</h2>
          <p>Send us your preferred dates and we will reply with availability and a personalised quote.</p>
          {submitted && <div className="success show" role="status" data-testid="status-enquiry-saved"><span className="success-copy"><Check size={15} /> Enquiry saved. WhatsApp is ready with your booking details.</span>{whatsappUrl && <a className="success-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-testid="link-send-whatsapp">Send via WhatsApp <ArrowUpRight size={13} /></a>}</div>}
          {formError && <div className="success show" role="alert" data-testid="status-enquiry-error">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field"><label htmlFor="guest-name">Your name</label><input id="guest-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="e.g. Alex Perera" data-testid="input-guest-name" /></div>
              <div className="field"><label htmlFor="guest-phone">Phone / WhatsApp</label><input id="guest-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required placeholder="+94 ..." data-testid="input-guest-phone" /></div>
              <div className="field"><label htmlFor="check-in">Check-in</label><input id="check-in" type="date" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} required data-testid="input-check-in" /></div>
              <div className="field"><label htmlFor="check-out">Check-out</label><input id="check-out" type="date" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} required data-testid="input-check-out" /></div>
              <div className="field"><label htmlFor="guest-count">Adults</label><select id="guest-count" value={form.guests} onChange={(event) => setForm({ ...form, guests: event.target.value })} data-testid="select-guests"><option>1–3 adults</option><option>4–6 adults</option><option>7–9 adults</option><option>10–11 adults</option></select></div>
              <div className="field"><label htmlFor="preferred-contact">Preferred reply</label><select id="preferred-contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} data-testid="select-contact"><option>WhatsApp</option><option>Phone call</option><option>Email</option></select></div>
              <div className="field full"><label htmlFor="guest-note">A note for us <span>(optional)</span></label><textarea id="guest-note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Tell us about your trip..." data-testid="input-guest-note" /></div>
            </div>
            <button className="btn form-submit" type="submit" data-testid="button-submit-enquiry">Send enquiry via WhatsApp <ArrowUpRight size={15} /></button>
          </form>
        </div>
      </div>

      <div className={`modal ${modal === 'dashboard' ? 'open' : ''}`} aria-hidden={modal !== 'dashboard'}>
        <div className="modal-card large" role="dialog" aria-modal="true" aria-labelledby="dashboard-title">
          <button className="modal-close" onClick={() => setModal(null)} aria-label="Close owner dashboard" data-testid="button-close-dashboard"><X size={21} /></button>
          <div className="dashboard-head"><div><span className="eyebrow">Private area</span><h2 id="dashboard-title">Owner dashboard</h2></div><button className="clear-btn" onClick={clearEnquiries} data-testid="button-clear-enquiries">Clear all enquiries</button></div>
          {enquiries.length === 0 ? <div className="empty" data-testid="empty-enquiries">No enquiries yet. New booking requests will appear here.</div> : enquiries.map((item) => (
            <article className="inquiry" key={item.id} data-testid={`card-enquiry-${item.id}`}>
              <div><strong>{item.name}</strong><p>{item.phone} · {item.guests} · {item.contact}</p><p>{formatDate(item.checkIn)} → {formatDate(item.checkOut)}{item.note ? ` · ${item.note}` : ''}</p><time>{new Date(item.createdAt).toLocaleString()}</time></div>
              <span className="inquiry-status">{item.status}</span>
            </article>
          ))}
        </div>
      </div>

      <div className={`modal lightbox ${modal === 'lightbox' ? 'open' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }} aria-hidden={modal !== 'lightbox'}>
        <div className="modal-card" role="dialog" aria-modal="true" aria-label="Gallery image preview">
          <button className="modal-close" onClick={() => setModal(null)} aria-label="Close gallery preview" data-testid="button-close-lightbox"><X size={22} /></button>
          {lightboxImage && <img src={lightboxImage.src} alt={lightboxImage.alt} data-testid="img-gallery-preview" />}
          <button className="lightbox-prev" onClick={() => setLightboxIndex((current) => (current - 1 + visibleImages.length) % visibleImages.length)} aria-label="Previous image" data-testid="button-gallery-previous"><ChevronLeft size={24} /></button>
          <button className="lightbox-next" onClick={() => setLightboxIndex((current) => (current + 1) % visibleImages.length)} aria-label="Next image" data-testid="button-gallery-next"><ChevronRight size={24} /></button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;