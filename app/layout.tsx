import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Escape Works - Exorcism Light Puzzle',
  description: 'Test and learn solutions to the light puzzle',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}