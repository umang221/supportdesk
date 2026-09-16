import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { LandingNav } from "@/components/marketing/LandingNav";
import { AnchorLink } from "@/components/marketing/AnchorLink";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import {
  TicketIcon,
  BoltIcon,
  SparkleIcon,
  AnalyticsIcon,
  TeamIcon,
  ShieldIcon,
} from "@/components/ui/icons";

const FEATURES = [
  {
    icon: TicketIcon,
    title: "Ticketing with a real state machine",
    description:
      "Open, pending, on hold, resolved, closed — every transition is validated server-side, so a ticket can never skip a stage that doesn't make sense.",
  },
  {
    icon: BoltIcon,
    title: "Realtime workspace",
    description:
      "New tickets, replies, and notifications stream in over a live connection the moment they happen — no manual refresh, no polling.",
  },
  {
    icon: SparkleIcon,
    title: "AI assist, not autopilot",
    description:
      "Gemini can summarize a ticket, suggest a category and priority, or draft a reply — every suggestion stays a suggestion until an agent reviews and sends it.",
  },
  {
    icon: AnalyticsIcon,
    title: "Analytics grounded in real data",
    description:
      "Ticket volume, resolution time, first-response time, and SLA compliance computed straight from MongoDB — with an optional AI narrative on top, never in place of the numbers.",
  },
  {
    icon: TeamIcon,
    title: "Admin, teams, and roles",
    description:
      "Agent, team lead, and admin roles gate who can reassign, unassign, or manage the org — with user, team, and SLA-policy management for admins.",
  },
  {
    icon: ShieldIcon,
    title: "Security by default",
    description:
      "HTTP-only session cookies, bcrypt-hashed passwords, object-level authorization on every sensitive action, rate-limited login, and a full audit trail.",
  },
];

const WORKFLOW_STEPS = [
  { step: "1", title: "Customer reports an issue", description: "A ticket is created with a priority and an SLA clock starts immediately." },
  { step: "2", title: "An agent responds", description: "The reply is timestamped as the first response and the customer is notified." },
  { step: "3", title: "SLA tracked live", description: "A background job keeps every open ticket's SLA state current and alerts before a deadline is missed." },
  { step: "4", title: "Resolved, on record", description: "Resolving stamps the resolution time and feeds straight into analytics — no separate reporting step." },
];

export const metadata = {
  title: "SupportDesk — Customer support, SLAs, and AI assist",
  description:
    "A ticketing and SLA management platform with a realtime agent workspace, Gemini-powered AI assist, and real-data analytics.",
};

export default async function Home() {
  const user = await getCurrentUser();
  const dashboardHref = user ? "/tickets" : null;

  return (
    <div className="flex flex-1 flex-col bg-canvas-bg">
      <LandingNav dashboardHref={dashboardHref} />

      <main id="main-content">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-space-lg py-space-3xl md:py-20">
          <div className="grid grid-cols-1 items-center gap-space-2xl lg:grid-cols-2 lg:gap-space-3xl">
            <div>
              <p className="text-label-sm font-medium uppercase tracking-wide text-primary">
                Customer support &amp; SLA platform
              </p>
              <h1 className="mt-space-sm text-display-lg text-text-primary md:text-[40px] md:leading-[46px]">
                Every ticket, on time — and an AI assist that never sends anything without you.
              </h1>
              <p className="mt-space-lg text-body-lg text-text-secondary">
                SupportDesk gives support teams a realtime workspace, automatic SLA tracking, and
                Gemini-powered ticket summaries and reply drafts — with role-based access and an
                audit trail underneath, built the way a production support tool should be.
              </p>
              <div className="mt-space-xl flex flex-wrap items-center gap-space-md">
                <Link
                  href={dashboardHref ?? "/portal/register"}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-space-lg text-label-md font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]"
                >
                  {dashboardHref ? "Go to dashboard" : "Get Support"}
                </Link>
                <AnchorLink
                  href="#workflow"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border-subtle px-space-lg text-label-md font-medium text-text-primary transition hover:bg-surface-hover"
                >
                  See how it works
                </AnchorLink>
              </div>
              <p className="mt-space-lg text-label-sm text-text-tertiary">
                Sample workspace view shown below — no account required to look around.
              </p>
            </div>

            <ProductPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-t border-border-subtle bg-surface-container-low py-space-3xl">
          <div className="mx-auto w-full max-w-6xl px-space-lg">
            <div className="max-w-2xl">
              <h2 className="text-headline-md text-text-primary">Everything a support team actually needs</h2>
              <p className="mt-space-sm text-body-md text-text-secondary">
                No generic dashboard filler — each of these ships as a working feature in the product, not a mockup.
              </p>
            </div>
            <div className="mt-space-xl grid grid-cols-1 gap-space-lg sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="scroll-mt-16 border-t border-border-subtle py-space-3xl">
          <div className="mx-auto w-full max-w-6xl px-space-lg">
            <div className="max-w-2xl">
              <h2 className="text-headline-md text-text-primary">From first message to resolved</h2>
              <p className="mt-space-sm text-body-md text-text-secondary">
                The same lifecycle every ticket in the system actually follows.
              </p>
            </div>
            <ol className="mt-space-xl grid grid-cols-1 gap-space-lg sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((item) => (
                <li key={item.step} className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-md font-semibold text-white">
                    {item.step}
                  </span>
                  <h3 className="mt-space-md text-body-md font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-space-xs text-body-sm text-text-secondary">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="scroll-mt-16 border-t border-border-subtle bg-surface-container-low py-space-3xl">
          <div className="mx-auto w-full max-w-6xl px-space-lg">
            <div className="grid grid-cols-1 gap-space-2xl lg:grid-cols-[1fr_1.2fr] lg:items-start">
              <div>
                <h2 className="text-headline-md text-text-primary">Built with production security in mind</h2>
                <p className="mt-space-sm text-body-md text-text-secondary">
                  These aren&rsquo;t aspirational bullet points — they&rsquo;re enforced in the code every request goes through.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                {[
                  "Server-derived identity — a request can never claim someone else's role or id.",
                  "Object-level checks on every sensitive action, not just page-level gates.",
                  "HTTP-only, SameSite session cookies — no tokens sit in client-readable storage.",
                  "Passwords hashed with bcrypt; nothing sensitive is ever logged.",
                  "Rate-limited login to slow down credential stuffing.",
                  "An append-only audit log for every admin action: who, what, and when.",
                ].map((item) => (
                  <li key={item} className="flex gap-space-sm text-body-sm text-text-secondary">
                    <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border-subtle py-space-3xl">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-space-lg px-space-lg text-center">
            <h2 className="text-headline-md text-text-primary">Take a look at the workspace</h2>
            <p className="max-w-xl text-body-md text-text-secondary">
              Sign in with a demo agent account to see ticket assignment, live SLA countdowns, and
              the AI assist panel in action.
            </p>
            <Link
              href={dashboardHref ?? "/login"}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-space-lg text-label-md font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]"
            >
              {dashboardHref ? "Go to dashboard" : "Staff Sign In"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle bg-surface-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-space-lg py-space-xl">
          <div className="flex flex-col gap-space-lg sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white">
                S
              </span>
              <span className="text-label-md font-semibold text-text-primary">SupportDesk</span>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-space-lg gap-y-space-sm text-body-sm text-text-secondary">
              {dashboardHref ? (
                <Link href={dashboardHref} className="hover:text-text-primary">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/portal/login" className="hover:text-text-primary">
                    Customer Portal
                  </Link>
                  <Link href="/login" className="hover:text-text-primary">
                    Staff Login
                  </Link>
                </>
              )}
              <AnchorLink href="#features" className="hover:text-text-primary">
                Features
              </AnchorLink>
              <AnchorLink href="#workflow" className="hover:text-text-primary">
                Workflow
              </AnchorLink>
              <AnchorLink href="#security" className="hover:text-text-primary">
                Security
              </AnchorLink>
            </nav>
          </div>

          <div className="flex flex-col gap-space-xs border-t border-border-subtle pt-space-lg text-label-sm text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} SupportDesk. A portfolio project — not a real company.</p>
            <p>Next.js · MongoDB · Gemini · Cloudinary</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
