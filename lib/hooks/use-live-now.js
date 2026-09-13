"use client";

import { useEffect, useState } from "react";

const CLOCK_TICK_MS = 30_000;

/**
 * Seeds a `now` timestamp from a server-computed value (so first client
 * render matches the server-rendered HTML exactly — see app/tickets/page.js
 * for why a render-time Date.now() default causes a hydration mismatch),
 * then ticks it forward on an interval after mount so relative-time/SLA
 * displays stay live.
 */
export function useLiveNow(initialNow) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  return now;
}
