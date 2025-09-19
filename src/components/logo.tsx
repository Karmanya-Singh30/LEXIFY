import * as React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="m14 10-5.5 5.5" />
      <path d="m14 14-1-1" />
      <path d="M10 10 9 9" />
      <path d="M16 5c.5-1 2-1 3 0" />
      <path d="M19 8c.5-1 2-1 3 0" />
    </svg>
  );
}
