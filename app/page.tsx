'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { debounce } from 'lodash'
import { Search, Film, Tv, AlertCircle } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const API_KEY = '6b1e21c238152148b72e0776bc1073b3'

export default function EntertainmentHub() {
  const [mediaType, setMediaType] = useState('movie')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedContent, setSelectedContent] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const iframeRef = useRef(null)

  const search = useCallback(
    debounce(async (page = 1) => {
      if (!query.trim()) {
        setResults([])
        setTotalPages(0)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(
            query
          )}&api_key=${API_KEY}&page=${page}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }

        const data = await response.json()
        setResults(data.results)
        setTotalPages(data.total_pages)
        setCurrentPage(page)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An error occurred while searching. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [query, mediaType]
  )

  useEffect(() => {
    search()
  }, [search, mediaType])

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
  }, [iframeRef, selectedContent])

  const handleContentSelect = (content) => {
    setSelectedContent(content)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card p-4 shadow-md">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-primary">Entertainment Hub</h1>
          <Select value={mediaType} onValueChange={setMediaType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="movie">
                <Film className="inline-block mr-2" />
                Movies
              </SelectItem>
              <SelectItem value="tv">
                <Tv className="inline-block mr-2" />
                TV Shows
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for a ${mediaType === 'movie' ? 'movie' : 'TV show'}`}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : selectedContent ? (
          <div className="mb-8">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                ref={iframeRef}
                src={`https://vidsrc.xyz/embed/${mediaType}/${selectedContent.id}`}
                allowFullScreen
                className="w-full h-full rounded-lg shadow-lg"
              ></iframe>
            </div>
            <Button
              onClick={() => setSelectedContent(null)}
              className="mt-4"
              variant="secondary"
            >
              Back to Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((result) => (
              <Card
                key={result.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleContentSelect(result)}
              >
                <div className="relative w-full h-64">
                  <Image
                    src={
                      result.poster_path
                        ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                        : 'https://via.placeholder.com/500x750.png?text=No+Image'
                    }
                    alt={result.title || result.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{result.title || result.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.release_date || result.first_air_date || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && !selectedContent && (
          <div className="mt-8 flex justify-center space-x-4">
            <Button
              onClick={() => search(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2 bg-card rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => search(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
