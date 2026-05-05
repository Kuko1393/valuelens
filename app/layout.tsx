import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ValueLens - Investment Screener',
  description: 'Value investing screener for US, European and Canadian markets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-primary text-white">{children}</body>
    </html>
  )
}
