import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transcendence',
  description: 'The titleeeeeeeeeeeeeeeeeee will be Transcendence. But with Nest and Next',
}

export default function RootLayout({children}: {children: React.ReactNode}) 
{
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
