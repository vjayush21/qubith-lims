import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-deep)] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">Q</span>
            </div>
            <span className="font-semibold text-[15px]">QuBith LIMS</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5"
            >
              Login
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium bg-[var(--primary-deep)] text-white px-4 py-1.5 rounded-lg hover:bg-[var(--primary-accent)] transition-colors"
            >
              Request Quotation
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-deep)] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-deep)]" />
            Built for Tier 2/3 India
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            India's pathology labs deserve better software.
          </h1>
          <p className="text-[15px] md:text-base text-[var(--text-secondary)] mt-5 max-w-2xl mx-auto leading-relaxed">
            Patient booking, barcode tracking, branded PDF reports, WhatsApp sharing, and GST billing.
            The LIMS built for the solo and small Indian pathology labs running on Excel and paper.
            From <span className="text-[var(--text-primary)] font-medium">₹2,500/month</span>.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="#request"
              className="text-sm font-medium bg-[var(--primary-deep)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--primary-accent)] transition-colors"
            >
              Request a Quotation
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-primary)] border border-[var(--border-subtle)] px-5 py-2.5 rounded-lg hover:border-[var(--text-tertiary)] transition-colors"
            >
              Login
            </Link>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Free 30-day trial · No credit card · Setup in 1 day
          </p>
        </section>

        {/* Problem */}
        <section className="max-w-6xl mx-auto px-6 py-12 border-t border-[var(--border-subtle)]">
          <div className="grid md:grid-cols-3 gap-px bg-[var(--border-subtle)] rounded-xl overflow-hidden">
            {[
              {
                icon: "📋",
                title: "Still on Excel + WhatsApp?",
                body: "Patient data scattered across files. Reports shared as photos. TAT slipping.",
              },
              {
                icon: "⏰",
                title: "Reports take 3-4 hours?",
                body: "Manual entry, manual barcode, manual delivery. Every step has friction.",
              },
              {
                icon: "💸",
                title: "CrelioHealth at ₹8K/mo?",
                body: "Built for chains. Overkill for a 50-test/day lab. You're paying for features you don't use.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-[var(--bg-elevated)] p-7"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="text-[15px] font-semibold mb-1.5">{card.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Everything a small lab needs. Nothing it doesn't.
            </h2>
            <p className="text-[var(--text-secondary)] mt-3 text-[15px]">
              Six core modules. One subscription. Add NABL compliance, B2B doctor portal, and
              home collection when you're ready.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border-subtle)] rounded-xl overflow-hidden">
            {[
              {
                title: "Patient Registration",
                body: "Search, tags, custom fields, ref doctor tracking. Find any patient in 2 seconds.",
              },
              {
                title: "Barcode Sample Tracking",
                body: "Generate at registration. Scan at every step. No lost samples.",
              },
              {
                title: "Branded PDF Reports",
                body: "Your lab's logo, header, footer. Generated in 30 seconds. Validated by your pathologist.",
              },
              {
                title: "WhatsApp Report Sharing",
                body: "One-click share. No API cost. Patient gets the report on their phone instantly.",
              },
              {
                title: "Home Collection",
                body: "Phlebotomist schedule, route planning, status tracking. Tier 2/3 labs love this.",
              },
              {
                title: "B2B Doctor Portal",
                body: "Referring doctors can self-register, view patient reports, set notification prefs.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-[var(--bg-elevated)] p-6"
              >
                <h3 className="text-[15px] font-semibold mb-1.5">{feat.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border-subtle)]">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-10">
            Up and running in a day.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Sign up",
                body: "5 minutes. Lab name, city, your name. Done.",
              },
              {
                step: "02",
                title: "We migrate",
                body: "Free data migration for first 10 labs. Excel → LIMS, no stress.",
              },
              {
                step: "03",
                title: "Go live",
                body: "Day 1. Process real patient reports through the system. Get a 15-min call with us if stuck.",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-xl p-6"
              >
                <div className="text-xs font-mono text-[var(--text-tertiary)] mb-3">
                  {step.step}
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border-subtle)]"
        >
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            Simple pricing. No per-test fees.
          </h2>
          <p className="text-[var(--text-secondary)] mb-10 text-[15px] max-w-2xl">
            One flat price per lab. Add modules as you grow. Annual plans get 2 months free.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Starter",
                price: "₹2,500",
                desc: "For solo labs doing up to 50 tests/day",
                features: [
                  "Up to 50 tests/day",
                  "3 user logins",
                  "Branded subdomain",
                  "Patient + test + report",
                  "WhatsApp sharing",
                ],
                cta: "Start trial",
                highlight: false,
              },
              {
                name: "Pro",
                price: "₹4,500",
                desc: "For growing labs doing up to 200 tests/day",
                features: [
                  "Up to 200 tests/day",
                  "8 user logins",
                  "Patient booking form",
                  "GST invoicing + dashboard",
                  "Home collection module",
                  "Priority WhatsApp support",
                ],
                cta: "Request Quotation",
                highlight: true,
              },
              {
                name: "Premium",
                price: "₹7,500",
                desc: "For multi-centre labs and chains",
                features: [
                  "Multi-centre (collection points)",
                  "B2B doctor portal",
                  "NABL audit trail module",
                  "Unlimited users",
                  "Priority support",
                ],
                cta: "Request Quotation",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 ${
                  plan.highlight
                    ? "border-2 border-[var(--primary-deep)] bg-[var(--bg-elevated)] relative"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-2.5 left-6 bg-[var(--primary-deep)] text-white text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Most popular
                  </div>
                )}
                <h3 className="text-[15px] font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-[var(--text-secondary)]">/mo + GST</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-5">{plan.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm flex items-start gap-2"
                    >
                      <span className="text-[var(--primary-deep)] mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="#request"
                  className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-[var(--primary-deep)] text-white hover:bg-[var(--primary-accent)]"
                      : "border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="max-w-6xl mx-auto px-6 py-8 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)]" />
              DPDP-compliant
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-info)]" />
              Data hosted in India
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)]" />
              Audit logs on every read/write
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-deep)]" />
              Built by the team behind qubith.in
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-[var(--border-subtle)]">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
            Frequently asked.
          </h2>
          <div className="space-y-px bg-[var(--border-subtle)] rounded-xl overflow-hidden">
            {[
              {
                q: "Is my patient data safe?",
                a: "Yes. AES-256 encryption at rest, TLS in transit, role-based access, full audit logs. DPDP Act 2023 compliant. Patient data never leaves India.",
              },
              {
                q: "Where is my data hosted?",
                a: "India. Hosted on a Hostinger VPS in the Mumbai region.",
              },
              {
                q: "I'm on Excel. Can I migrate?",
                a: "Yes, free data migration for the first 10 labs. We import your existing patient list and test catalog.",
              },
              {
                q: "Do I need to buy any hardware?",
                a: "No. Runs in browser + Android app. Use any laptop, tablet, or phone.",
              },
              {
                q: "What about analyzer integration?",
                a: "Coming in v2. For now, manual result entry, which most Tier 2/3 labs do anyway.",
              },
              {
                q: "What if I cancel?",
                a: "Your data is exported in standard CSV/PDF format. No lock-in.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="bg-[var(--bg-elevated)] group"
              >
                <summary className="cursor-pointer p-5 text-[15px] font-medium list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-[var(--text-tertiary)] group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section
          id="request"
          className="max-w-3xl mx-auto px-6 py-20 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Ready to go paperless?
          </h2>
          <p className="text-[var(--text-secondary)] mt-3 text-[15px] max-w-xl mx-auto">
            We'll show you a 15-min demo on Google Meet and migrate your data for free.
          </p>
          <form
            className="mt-8 max-w-md mx-auto space-y-3 text-left"
            action="mailto:hello@qubith.in"
            method="post"
            encType="text/plain"
          >
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
            />
            <input
              type="text"
              name="lab"
              placeholder="Lab name"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              className="w-full px-3.5 py-2.5 text-sm border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-elevated)] focus:border-[var(--primary-deep)] focus:ring-2 focus:ring-[var(--primary-deep)] focus:ring-opacity-20 outline-none transition-all"
            />
            <button
              type="submit"
              className="w-full bg-[var(--primary-deep)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--primary-accent)] transition-colors"
            >
              Request Free Demo
            </button>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="w-5 h-5 rounded bg-[var(--primary-deep)] flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">Q</span>
            </div>
            <span>Built by QuBith Labs</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-[var(--text-secondary)]">
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)]">
              Terms
            </Link>
            <a href="mailto:hello@qubith.in" className="hover:text-[var(--text-primary)]">
              hello@qubith.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
