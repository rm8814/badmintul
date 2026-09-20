import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
}

export function CompassIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" /></Icon>
}

export function CalendarIcon(props: IconProps) {
  return <Icon {...props}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Icon>
}

export function BuildingIcon(props: IconProps) {
  return <Icon {...props}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h1M8 11h1M8 15h1M15 7h1M15 11h1M15 15h1M10 21v-4h4v4" /></Icon>
}

export function ClockIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Icon>
}

export function ChartBarIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 20V10M10 20V4M16 20v-7M4 20h16" /></Icon>
}

export function ClipboardCheckIcon(props: IconProps) {
  return <Icon {...props}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 13l2 2 4-4" /></Icon>
}

export function ChartPieIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 3v9l7.79 4.5A9 9 0 1 1 12 3Z" /><path d="M21 12a9 9 0 0 0-9-9v9h9Z" /></Icon>
}

export function UsersIcon(props: IconProps) {
  return <Icon {...props}><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 13.5A4.5 4.5 0 0 1 20.5 18" /></Icon>
}

export function CogIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></Icon>
}

export function EyeSwitchIcon(props: IconProps) {
  return <Icon {...props}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
}

export function DocumentListIcon(props: IconProps) {
  return <Icon {...props}><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4a1 1 0 0 0 1 1h4M8 12h8M8 16h8" /></Icon>
}
