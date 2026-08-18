export function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 20 18" width="20">
      <path d="M2 4h16M2 9h16M2 14h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function PersonIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="20" viewBox="0 0 20 20" width="20">
      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 17c.9-3.6 3.9-5.5 6.5-5.5s5.6 1.9 6.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function FleetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M3 11.5l1.2-3.4A2 2 0 016.1 6.8h7.8a2 2 0 011.9 1.3l1.2 3.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3 11.5h14v3a.5.5 0 01-.5.5H15a.5.5 0 01-.5-.5V14h-9v.5a.5.5 0 01-.5.5H3.5a.5.5 0 01-.5-.5v-3z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M5.5 12.75h.5M14 12.75h.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
