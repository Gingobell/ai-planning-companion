// Brand mark (DESIGN.md section 1): a start dot and an end dot joined by a curved path, a goal turned into steps.
export function RouteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="5" cy="18" r="2.5" fill="currentColor" />
      <circle cx="19" cy="6" r="2.5" fill="currentColor" />
      <path
        d="M7 16.5C10.5 8.5 13.5 15.5 17 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
