'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ui_host: 'https://eu.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We capture manually using PostHogPageView
      capture_pageleave: true,
      // No scroll-depth properties: their listener reads the document's scroll height on every scroll event, which
      // forces a layout in the middle of the scroll-linked animations (it was the single hottest thing on a phone).
      disable_scroll_properties: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
