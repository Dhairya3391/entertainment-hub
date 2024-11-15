import { useEffect } from 'react'

export function useAdBlocker(iframeRef) {
  useEffect(() => {
    if (!iframeRef.current) return

    const removeAds = (element) => {
      const adSelectors = [
        'div[id^="adb"]',
        'div[class*="ad-"]',
        'iframe[src*="ads"]',
        '.video-ads',
        '#player-ads'
      ]

      adSelectors.forEach(selector => {
        element.querySelectorAll(selector).forEach(el => el.remove())
      })
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          removeAds(mutation.target)
        }
      })
    })

    observer.observe(iframeRef.current.contentDocument.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [iframeRef])
}
