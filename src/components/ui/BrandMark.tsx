import logo from "@/assets/logo.svg"

/** Lakhpati Didi Chhattisgarh logo. Decorative: the brand name is always shown next to it. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <img
      className="brand-mark"
      src={logo}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  )
}
