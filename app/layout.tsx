import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ValueLens – Investment Screener',
  description: 'Value investing screener for US, European and Canadian markets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-app text-main min-h-screen">
        <nav className="border-b border-app bg-card sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-blue-400 transition-colors">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              ValueLens
            </Link>
            <div className="flex items-center gap-6 text-sm text-sub">
              <Link href="/" className="hover:text-main transition-colors">Screener</Link>
              <Link href="/watchlist" className="hover:text-main transition-colors">Watchlist</Link>
              <Link href="/ideas" className="hover:text-main transition-colors">Ideas</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-[1600px] mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
