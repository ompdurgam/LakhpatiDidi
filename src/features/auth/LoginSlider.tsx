import { useEffect, useState } from "react"

import { loginSlides } from "@/features/auth/loginSlides"

export function LoginSlider({ english }: { english: boolean }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(
      () => setActive((value) => (value + 1) % loginSlides.length),
      4500,
    )
    return () => window.clearInterval(id)
  }, [paused])
  return (
    <figure
      className="login-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="login-slider-frame">
        {loginSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={english ? slide.en : slide.hi}
            className={index === active ? "active" : ""}
            aria-hidden={index !== active}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      <figcaption>
        <span>{english ? loginSlides[active].en : loginSlides[active].hi}</span>
        <div className="login-slider-dots">
          {loginSlides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              className={index === active ? "active" : ""}
              aria-label={`${english ? "Slide" : "स्लाइड"} ${index + 1}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
