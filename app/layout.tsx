import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'

const bodyFont = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const displayFont = Playfair_Display({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Double Shot — Good coffee. Better company.',
  description: 'An all-day coffee house for slow mornings, long conversations, and the perfect second cup in Model Town, Lahore.',
  generator: 'Double Shot',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f3eee5' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
