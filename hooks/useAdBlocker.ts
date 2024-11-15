import { useEffect, RefObject } from 'react'

export function useAdBlocker(iframeRef: RefObject<HTMLIFrameElement>) {
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const removeAds = (element: Element) => {
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
          removeAds(mutation.target as Element)
        }
      })
    })

    const onLoad = () => {
      const contentDocument = iframe.contentDocument
      if (contentDocument) {
        observer.observe(contentDocument.body, {
          childList: true,
          subtree: true
        })
      }
    }

    iframe.addEventListener('load', onLoad)

    return () => {
      observer.disconnect()
      iframe.removeEventListener('load', onLoad)
    }
  }, [iframeRef])
}
