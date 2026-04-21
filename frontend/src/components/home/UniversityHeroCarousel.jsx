import { useEffect, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/effect-fade"
import "./university-hero-carousel.css"
import { getHomepageNotifications } from "../../services/notificationService"

const HeroSkeleton = () => {
  return (
    <section className="w-full h-[70vh] min-h-[420px] bg-slate-200 animate-pulse">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="w-full md:w-2/3 space-y-4">
          <div className="h-10 w-48 bg-slate-300 rounded-md"></div>
          <div className="h-14 w-full bg-slate-300 rounded-md"></div>
          <div className="h-6 w-3/4 bg-slate-300 rounded-md"></div>
          <div className="h-11 w-36 bg-slate-300 rounded-md"></div>
        </div>
      </div>
    </section>
  )
}

const EmptyHero = () => {
  return (
    <section className="w-full bg-slate-900 text-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold">Welcome to Our University</h2>
        <p className="text-slate-300 mt-3">No active hero slides are published yet. Please check back soon.</p>
      </div>
    </section>
  )
}

export default function UniversityHeroCarousel() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)

  const fallbackImage =
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=80"

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const data = await getHomepageNotifications()
        setSlides(Array.isArray(data) ? data : [])
      } catch {
        setSlides([])
      } finally {
        setLoading(false)
      }
    }

    loadSlides()
  }, [])

  if (loading) {
    return <HeroSkeleton />
  }

  if (!slides.length) {
    return <EmptyHero />
  }

  return (
    <section className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop
        speed={900}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        navigation={{
          prevEl: ".hero-swiper-prev",
          nextEl: ".hero-swiper-next"
        }}
        pagination={{
          clickable: true,
          el: ".hero-swiper-pagination"
        }}
        className="w-full h-[72vh] min-h-[440px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.slide_id}>
            <div className="relative w-full h-[72vh] min-h-[440px]">
              <img
                src={slide.image_url || fallbackImage}
                alt={slide.title || "University hero slide"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/55 to-slate-900/20"></div>

              <div className="relative z-10 mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center">
                <div className="max-w-3xl text-white">
                  <div className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1 text-xs tracking-[0.2em] uppercase backdrop-blur-sm">
                    University Notice
                  </div>

                  <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-md">
                    {slide.title}
                  </h1>

                  {slide.subtitle ? (
                    <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-100/95 max-w-2xl">
                      {slide.subtitle}
                    </p>
                  ) : null}

                  {slide.button_text && slide.button_link ? (
                    <a
                      href={slide.button_link}
                      className="mt-7 inline-flex items-center rounded-md bg-amber-300 px-6 py-3 text-slate-900 font-semibold hover:bg-amber-200 transition-colors"
                    >
                      {slide.button_text}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        <button
          className="hero-swiper-prev absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/25 text-white backdrop-blur-md border border-white/30 hover:bg-white/35 transition"
          aria-label="Previous slide"
          type="button"
        >
          <span className="text-xl">&#x2039;</span>
        </button>

        <button
          className="hero-swiper-next absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/25 text-white backdrop-blur-md border border-white/30 hover:bg-white/35 transition"
          aria-label="Next slide"
          type="button"
        >
          <span className="text-xl">&#x203A;</span>
        </button>

        <div className="hero-swiper-pagination absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-2"></div>
      </Swiper>
    </section>
  )
}
