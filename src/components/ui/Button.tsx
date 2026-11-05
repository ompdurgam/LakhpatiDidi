import type { ButtonHTMLAttributes } from "react"

import { Icon, type IconName } from "./Icon"

type Variant = "primary" | "secondary" | "icon"

/** Button using the design's `.primary` / `.secondary` / `.icon-button` classes. */
export function Button({
  variant = "secondary",
  icon,
  iconSize = 16,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: IconName
  iconSize?: number
}) {
  const base = variant === "icon" ? "icon-button" : variant
  return (
    <button type={type} className={`${base} ${className}`.trim()} {...rest}>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  )
}
