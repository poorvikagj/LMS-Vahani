import { Link } from "react-router-dom"
import UniversityHeroCarousel from "../../components/home/UniversityHeroCarousel"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-wide">LMS Vahani University</h1>
          <Link
            to="/"
            className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      <UniversityHeroCarousel />
    </div>
  )
}
