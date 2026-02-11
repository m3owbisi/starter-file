import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#0d0d2b] to-[#111133] px-4">
          <div className="text-center">
            {/* animated 404 number */}
            <div className="relative mb-8">
              <h1 className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#3c50e0] via-[#8b5cf6] to-[#06b6d4] animate-pulse sm:text-[14rem]">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full bg-[#3c50e0]/10 blur-3xl" />
              </div>
            </div>

            {/* message */}
            <h2 className="mb-3 text-2xl font-semibold text-white sm:text-3xl">
              page not found
            </h2>
            <p className="mx-auto mb-10 max-w-md text-base text-gray-400">
              the route you're looking for doesn't exist in the proteinbind
              platform. it may have been moved or the URL might be incorrect.
            </p>

            {/* action buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3c50e0] to-[#8b5cf6] px-6 py-3 font-medium text-white shadow-lg shadow-[#3c50e0]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#3c50e0]/30 hover:-translate-y-0.5"
              >
                <Home size={18} />
                back to dashboard
              </Link>
              <Link
                href="/research"
                className="group flex items-center gap-2 rounded-xl border border-[#3c50e0]/30 bg-[#3c50e0]/5 px-6 py-3 font-medium text-[#6366f1] transition-all duration-300 hover:bg-[#3c50e0]/10 hover:border-[#3c50e0]/50"
              >
                <Search size={18} />
                search compounds
              </Link>
            </div>

            {/* quick navigation links */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <span>quick links:</span>
              <Link
                href="/molecule-bank"
                className="text-[#6366f1] transition-colors hover:text-[#8b5cf6]"
              >
                molecule bank
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/model"
                className="text-[#6366f1] transition-colors hover:text-[#8b5cf6]"
              >
                generate molecules
              </Link>
              <span className="text-gray-700">•</span>
              <Link
                href="/message"
                className="text-[#6366f1] transition-colors hover:text-[#8b5cf6]"
              >
                messages
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
