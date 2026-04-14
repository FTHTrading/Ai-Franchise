import Link from 'next/link';
import { Button, Badge, Card, CardContent, formatCurrency } from '@aaos/ui';
import {
  Zap,
  MessageSquare,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Check,
  ArrowRight,
  Star,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// ── Navigation ────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AgencyOS</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`${APP_URL}/sign-in`}>
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href={`${APP_URL}/sign-up`}>
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden py-24 px-6">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <Badge variant="secondary" className="text-sm px-4 py-1.5">
          🚀 Now with AI-powered lead scoring
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Scale your agency with{' '}
          <span className="text-primary">AI automation</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AgencyOS is the all-in-one platform that helps marketing agencies automate lead follow-up,
          book more appointments, and deliver measurable results for every client.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={`${APP_URL}/sign-up`}>
            <Button size="lg" className="gap-2 text-base px-8">
              Start for Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base px-8">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI SMS Follow-Up',
    description:
      'Automatically follow up with every new lead via SMS using AI-personalized messages. Never let a lead go cold again.',
  },
  {
    icon: TrendingUp,
    title: 'Lead Pipeline',
    description:
      'Visual Kanban board for every client. Track leads from new to won with one-click updates and real-time scoring.',
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    description:
      'AI-powered booking flows that move leads from conversation to confirmed appointment automatically.',
  },
  {
    icon: Users,
    title: 'Multi-Client Management',
    description:
      'Manage unlimited clients from one workspace. Each client gets their own pipeline, inbox, and automations.',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description:
      'Install pre-built automation templates in minutes. 5-step follow-up, reactivation campaigns, and more.',
  },
  {
    icon: BarChart3,
    title: 'Agency Analytics',
    description:
      'Real-time MRR, conversion rates, and workflow performance across all clients. Know exactly what\'s working.',
  },
];

function Features() {
  return (
    <section id="features" className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything your agency needs</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            One platform to run your entire agency operation, from lead capture to client reporting.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 297,
    description: 'Perfect for agencies just getting started.',
    features: [
      '5 client accounts',
      '500 AI messages/month',
      '3 active workflows',
      'Lead pipeline & scoring',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 597,
    description: 'For growing agencies ready to scale.',
    features: [
      '25 client accounts',
      '5,000 AI messages/month',
      'Unlimited workflows',
      'Appointment booking',
      'Analytics dashboard',
      'Priority support',
    ],
    cta: 'Start Growth',
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 997,
    description: 'Enterprise power for high-volume agencies.',
    features: [
      'Unlimited clients',
      'Unlimited AI messages',
      'White-label branding',
      'Custom integrations',
      'Dedicated onboarding',
      'SLA + phone support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free. Upgrade as you grow. No hidden fees.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 space-y-6 ${
                plan.popular ? 'border-primary ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3">Most Popular</Badge>
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div>
                <span className="text-4xl font-extrabold">{formatCurrency(plan.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`${APP_URL}/sign-up`} className="block">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Marcus T.',
    role: 'Owner, Apex Lead Gen',
    quote: 'We went from manually texting leads to 100% automated follow-up in one day. Our show rate went from 40% to 72%.',
    stars: 5,
  },
  {
    name: 'Sara K.',
    role: 'Director, Growth Collective',
    quote: 'AgencyOS replaced three separate tools. The client portal alone saves us hours of reporting every week.',
    stars: 5,
  },
  {
    name: 'Devon R.',
    role: 'Founder, Revenue Rocket',
    quote: 'The AI follow-up sequences book appointments while I sleep. Best investment I\'ve made for my agency.',
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Loved by agency owners</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-3xl text-center space-y-6">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Ready to automate your agency?
        </h2>
        <p className="text-xl text-muted-foreground">
          Join hundreds of agencies using AgencyOS to deliver better results for their clients.
        </p>
        <Link href={`${APP_URL}/sign-up`}>
          <Button size="lg" className="gap-2 text-base px-10">
            Start Your Free Trial <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground">14-day free trial · No credit card required</p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold">AgencyOS</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AgencyOS. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
