import type { Metadata, Viewport } from "next"
import type { PropsWithChildren } from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import { Providers } from "./providers"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { Fragment } from "react"
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script"

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
})

// Export viewport configuration separately
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
}

// Updated metadata configuration for Vercel deployment
export const metadata: Metadata = {
  title: 'Vidiony - Video Streaming Platform',
  description: 'Watch movies, TV shows, shorts, and music videos on Vidiony. Stream your favorite content anytime, anywhere.',
  keywords: 'vidiony, vidion, video streaming, movies, TV shows, shorts, music videos, online streaming, free videos, watch videos online',
  authors: [{ name: 'Vidiony' }],
  creator: 'Vidiony',
  publisher: 'Vidiony',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://vidion.vercel.app'),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vidiony',
  },
  openGraph: {
    title: 'Vidiony - Video Streaming Platform',
    description: 'Watch movies, TV shows, shorts, and music videos on Vidiony. Stream your favorite content anytime, anywhere.',
    url: 'https://vidion.vercel.app',
    siteName: 'Vidiony',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://vidion.vercel.app/logo.png',
        width: 800,
        height: 600,
        alt: 'Vidiony Logo',
      },
      {
        url: 'https://vidion.vercel.app/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Vidiony - Video Streaming Platform',
      },
      {
        url: 'https://vidion.vercel.app/placeholder-thumbnail.jpg',
        width: 1280,
        height: 720,
        alt: 'Watch videos on Vidiony',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vidiony - Video Streaming Platform',
    description: 'Watch movies, TV shows, shorts, and music videos on Vidiony. Stream your favorite content anytime, anywhere.',
    images: [
      'https://vidion.vercel.app/logo.png',
      'https://vidion.vercel.app/placeholder.jpg'
    ],
  },
  verification: {
    google: 'ABCg9GS2lVnsrDFDj22yTT_Mc6ya9-fMXl09o3OIQ9I',
    other: {
      'msvalidate.01': '64FD345A7FD651E59AAAB61644D157FE'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  },
}

export default async function RootLayout({ children }: PropsWithChildren) {


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="schema-website" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Vidiony",
              "alternateName": "Vidion",
              "url": "https://vidion.vercel.app",
              "description": "Watch movies, TV shows, shorts, and music videos on Vidiony. Stream your favorite content anytime, anywhere.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://vidion.vercel.app/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }
          `}
        </Script>
        <Script id="schema-organization" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Vidiony",
              "alternateName": "Vidion",
              "url": "https://vidion.vercel.app",
              "logo": "https://vidion.vercel.app/logo.png"
            }
          `}
        </Script>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          async
          defer
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <ServiceWorkerRegistration />
          <ClientLayout>{children}</ClientLayout>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}