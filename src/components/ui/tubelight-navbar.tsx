"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SynthosLogo } from "@/components/ui/synthos-logo"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

/** Path part of a nav url ("/#features" -> "/", "/pricing" -> "/pricing", "#hero" -> ""). */
function pathOf(url: string) {
  return url.split("#")[0]
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  // Tracks the last clicked item so hash links (same-page scroll) can be marked active.
  const [clickedTab, setClickedTab] = useState<string | null>(null)

  const activeTab = useMemo(() => {
    // A clicked item stays active while we are still on the page it belongs to
    // (hash links don't change the pathname).
    if (clickedTab) {
      const clicked = items.find((item) => item.name === clickedTab)
      if (clicked) {
        const path = pathOf(clicked.url)
        if (path === "" || path === pathname) return clickedTab
      }
    }
    // Otherwise derive from the current route: exact path match first,
    // then a hash link whose base path matches (e.g. "/#features" on "/").
    const exact = items.find((item) => item.url === pathname)
    if (exact) return exact.name
    const hashMatch = items.find(
      (item) => item.url.includes("#") && pathOf(item.url) === pathname,
    )
    return hashMatch ? hashMatch.name : null
  }, [clickedTab, items, pathname])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6 select-none pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg pointer-events-auto">
        {/* Logo */}
        <Link href="/" className="pl-2 pr-1 hidden sm:block select-none" draggable={false}>
          <SynthosLogo size={28} />
        </Link>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setClickedTab(item.name)}
              draggable={false}
              aria-label={item.name}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors select-none",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
