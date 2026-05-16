import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ValueLens — Investment Screener',
  description: 'Value investing screener for US, European and Canadian markets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
