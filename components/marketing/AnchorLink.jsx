"use client";

/**
 * In-page section link for the landing page. A plain `<a href="#id">` lets
 * the browser own the navigation, which pushes a new history entry for
 * every click — clicking through Features -> Workflow -> Security and then
 * on to Sign in leaves Back cycling through each anchor instead of
 * returning straight to "/". This intercepts the click and scrolls
 * manually instead, so no hash is ever written to the URL/history. The
 * `href` stays a real "#id" (not a `javascript:`/button) so the link still
 * works with JS disabled, is keyboard-focusable, and reads correctly to
 * assistive tech.
 */
export function AnchorLink({ href, onNavigate, children, className }) {
  function handleClick(event) {
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      onNavigate?.();
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
