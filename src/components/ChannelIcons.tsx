interface IconProps {
  className?: string;
}

export function YouTubeIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.25" y="5" width="19.5" height="14" rx="4.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 9.2L15.3 12L10 14.8V9.2Z" fill="currentColor" />
    </svg>
  );
}

export function RutubeIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.2 8.5H12.2C14.9 8.5 16.4 9.8 16.4 11.9C16.4 14.1 14.8 15.5 12.1 15.5H9.2V8.5ZM11 10.1V13.9H12C13.7 13.9 14.5 13.2 14.5 12C14.5 10.8 13.7 10.1 12 10.1H11Z" fill="currentColor" />
    </svg>
  );
}

export function BookMonogramIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 6.5C4.5 5.4 5.4 4.5 6.5 4.5H11.5V19.5H6.5C5.4 19.5 4.5 18.6 4.5 17.5V6.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19.5 6.5C19.5 5.4 18.6 4.5 17.5 4.5H12.5V19.5H17.5C18.6 19.5 19.5 18.6 19.5 17.5V6.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 8.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
