import { AppShell } from "@/components/layout/AppShell";
import { AgentWorkspace } from "@/components/tickets/AgentWorkspace";

export const metadata = {
  title: "Tickets · SupportDesk",
};

export default function TicketsPage() {
  // Computed once per request on the server and passed down as the initial
  // clock value for AgentWorkspace, so the first client render (hydration)
  // reuses this exact number instead of calling Date.now() again — see the
  // note on AgentWorkspace's `now` state for why that matters. This is a
  // Server Component page function invoked once per request, not a
  // re-rendering client component, so the purity rule's concern (an impure
  // call producing different output across re-renders) doesn't apply here.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <AppShell activeHref="/tickets">
      <AgentWorkspace initialNow={initialNow} />
    </AppShell>
  );
}
