"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { WatchLaterProvider } from "@/contexts/watch-later-context"
import { LikedVideosProvider } from "@/contexts/liked-videos-context"
import { useState, Suspense, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { usePathname, useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import components with loading states
const Navbar = dynamic(() => import("@/components/navbar"), {
  ssr: false,
  loading: () => <div className="h-16 w-full bg-background border-b animate-pulse" />
})

const CategoryBar = dynamic(() => import("./components/CategoryBar"), {
  ssr: true,
  loading: () => <div className="h-8 w-full bg-background border-b animate-pulse" />
})

const Sidebar = dynamic(() => import("@/components/sidebar"), {
  ssr: false,
  loading: () => (
    <div className="hidden md:block w-64 h-full bg-background border-r animate-pulse" />
  )
})

function LayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isMoviesPage = pathname === "/category/movies" || pathname.startsWith("/category/movies/")
  const isWatchPage = pathname === "/watch" || pathname.startsWith("/watch/")

  // Prefetch common routes
  useEffect(() => {
    // Keep this list limited to routes that actually exist.
    const commonRoutes = [
      '/home',
      '/trending',
      '/featured',
      '/music',
      '/tmdb-movies',
      '/immersive-shorts',
    ]
    commonRoutes.forEach(route => {
      router.prefetch(route)
    })
  }, [router])

  // Add watch-page-active class to body when on watch page
  useEffect(() => {
    if (isWatchPage) {
      document.body.classList.add('watch-page-active')
      document.documentElement.classList.add('watch-page-active')
    } else {
      document.body.classList.remove('watch-page-active')
      document.documentElement.classList.remove('watch-page-active')
    }

    return () => {
      document.body.classList.remove('watch-page-active')
      document.documentElement.classList.remove('watch-page-active')
    }
  }, [isWatchPage])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    closeMobileMenu()
  }, [pathname])

  const renderHeader = (): JSX.Element | null => {
    if (isMoviesPage) return null
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <Suspense fallback={<div className="h-16 w-full bg-background border-b animate-pulse" />}>
          <Navbar isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
        </Suspense>
        {!isWatchPage && (
          <Suspense fallback={<div className="h-8 w-full bg-background border-b animate-pulse" />}>
            <CategoryBar />
          </Suspense>
        )}
      </div>
    )
  }

  const renderSidebar = (): JSX.Element | null => {
    if (isMoviesPage || isWatchPage) return null
    return (
      <Suspense fallback={<div className="w-64 h-full bg-background border-r animate-pulse" />}>
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
          toggleMobileMenu={toggleMobileMenu}
        />
      </Suspense>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {renderHeader()}
      <div className={`flex flex-1 ${!isMoviesPage ? 'pt-16' : ''} ${isWatchPage ? 'pt-16 md:pt-16' : ''}`}>
        {renderSidebar()}
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="w-full h-full bg-background animate-pulse" />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-16 w-full bg-background border-b" />
        <div className="flex flex-1 pt-16">
          <div className="w-64 h-full bg-background border-r" />
          <main className="flex-1 overflow-auto" />
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark", "system"]}
    >
      <LikedVideosProvider>
        <WatchLaterProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </WatchLaterProvider>
      </LikedVideosProvider>
    </ThemeProvider>
  )
} 
