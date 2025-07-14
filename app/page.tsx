"use client";
import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import { debounce } from "lodash";
import { Search, X } from "lucide-react";

const API_KEY = "6b1e21c238152148b72e0776bc1073b3";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/";
const VIDSRC_BASE_URL = "https://vidsrc.xyz/embed/";

const CATEGORIES = [
  { title: "Trending Now", endpoint: "trending/all/week" },
  { title: "Top Rated Movies", endpoint: "movie/top_rated" },
  { title: "Popular TV Shows", endpoint: "tv/popular" },
  { title: "Action Movies", endpoint: "discover/movie?with_genres=28" },
  { title: "Comedy Movies", endpoint: "discover/movie?with_genres=35" },
  { title: "Horror Movies", endpoint: "discover/movie?with_genres=27" },
  { title: "Sci-Fi & Fantasy", endpoint: "discover/movie?with_genres=878,14" },
  { title: "Netflix Originals", endpoint: "discover/tv?with_networks=213" },
  { title: "Animation", endpoint: "discover/movie?with_genres=16" },
  { title: "Documentaries", endpoint: "discover/movie?with_genres=99" },
];

// --- Custom Hooks ---
function useHero() {
  const [heroItems, setHeroItems] = React.useState<any[]>([]);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchHero() {
      setLoading(true);
      setError(null);
      try {
        const endpoints = [
          "movie/popular",
          "tv/popular",
          "trending/all/week",
          "movie/upcoming",
        ];
        const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const res = await fetch(`${TMDB_BASE_URL}/${randomEndpoint}?api_key=${API_KEY}&language=en-US`);
        const data = await res.json();
        const valid = (data.results || []).filter((item: any) => item.backdrop_path);
        setHeroItems(valid.slice(0, 10));
        setHeroIndex(0);
      } catch (e) {
        setError("Failed to load featured content.");
      } finally {
        setLoading(false);
      }
    }
    fetchHero();
  }, []);

  React.useEffect(() => {
    if (heroItems.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroItems]);

  return { heroItems, heroIndex, setHeroIndex, loading, error };
}

function useCategories() {
  const [categories, setCategories] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError(null);
      try {
        const catData: any = {};
        await Promise.all(
          CATEGORIES.map(async (cat) => {
            const res = await fetch(`${TMDB_BASE_URL}/${cat.endpoint}?api_key=${API_KEY}&language=en-US`);
            const data = await res.json();
            catData[cat.title] = (data.results || []).filter((item: any) => item.poster_path);
          })
        );
        setCategories(catData);
      } catch (e) {
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return { categories, loading, error };
}

function useSearch() {
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debouncedSuggest = React.useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setSearchSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(q)}&api_key=${API_KEY}&language=en-US`
        );
        const data = await res.json();
        setSearchSuggestions(
          (data.results || [])
            .filter((item: any) => ["movie", "tv"].includes(item.media_type) && item.poster_path)
            .slice(0, 6)
        );
      } catch (e) {
        setSearchSuggestions([]);
      }
    }, 250),
    []
  );

  React.useEffect(() => {
    if (search.length > 1) {
      debouncedSuggest(search);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  }, [search, debouncedSuggest]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    setError(null);
    try {
      const [multi, movie, tv] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(search)}&api_key=${API_KEY}&language=en-US`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(search)}&api_key=${API_KEY}&language=en-US`).then(r => r.json()),
        fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(search)}&api_key=${API_KEY}&language=en-US`).then(r => r.json()),
      ]);
      // Deduplicate and merge
      const seen = new Set();
      const all = [...(multi.results || []), ...(movie.results || []), ...(tv.results || [])]
        .filter((item: any) => {
          const key = `${item.media_type || (item.title ? "movie" : "tv")}-${item.id}`;
          if (seen.has(key) || !item.poster_path) return false;
          seen.add(key);
          return true;
        });
      setSearchResults(all);
    } catch (e) {
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    search,
    setSearch,
    searchResults,
    setSearchResults,
    searchSuggestions,
    showSuggestions,
    setShowSuggestions,
    loading,
    error,
    handleSearch,
  };
}

function usePlayer() {
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [playerMedia, setPlayerMedia] = React.useState<any>(null);
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openPlayer = async (media: any) => {
    setPlayerMedia(media);
    setPlayerOpen(true);
    setLoading(true);
    setError(null);
    try {
      const type = media.media_type || (media.title ? "movie" : "tv");
      const res = await fetch(`${TMDB_BASE_URL}/${type}/${media.id}/recommendations?api_key=${API_KEY}&language=en-US`);
      const data = await res.json();
      setRecommendations((data.results || []).filter((item: any) => item.poster_path));
    } catch (e) {
      setError("Failed to load recommendations.");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    playerOpen,
    setPlayerOpen,
    playerMedia,
    openPlayer,
    recommendations,
    loading,
    error,
  };
}

export default function Nuflix() {
  const hero = useHero();
  const categories = useCategories();
  const search = useSearch();
  const player = usePlayer();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- UI ---
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-30 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 flex items-center justify-between transition-all duration-300">
        <motion.h1
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#e50914] select-none cursor-pointer"
        >
          NUFLIX
        </motion.h1>
        <form onSubmit={search.handleSearch} className="relative w-[180px] sm:w-[300px]" role="search">
          <Input
            ref={searchInputRef}
            type="text"
            value={search.search}
            onChange={e => search.setSearch(e.target.value)}
            placeholder="Search for movies, TV shows..."
            className="pl-4 pr-10 py-2 bg-black/60 border border-neutral-700 text-white rounded-md focus:ring-2 focus:ring-[#e50914]"
            autoComplete="off"
            aria-label="Search for movies or TV shows"
            onFocus={() => search.setShowSuggestions(search.search.length > 1)}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={search.showSuggestions}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <AnimatePresence>
            {search.showSuggestions && search.searchSuggestions.length > 0 && (
              <motion.div
                id="search-suggestions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-[#222] rounded-lg shadow-lg z-50 border border-neutral-700 overflow-hidden"
                role="listbox"
              >
                {search.searchSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[#333] text-left"
                    onClick={() => {
                      search.setSearch(item.title || item.name);
                      search.setShowSuggestions(false);
                      player.openPlayer(item);
                    }}
                    role="option"
                  >
                    <img
                      src={`${IMG_BASE_URL}w92${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{item.title || item.name}</div>
                      <div className="text-xs text-neutral-400 truncate">
                        {(item.release_date || item.first_air_date || "").slice(0, 4)} • {item.media_type === "tv" ? "TV" : "Movie"}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20" />

      {/* Hero Section */}
      <section className="relative flex flex-col justify-center min-h-[60vw] max-h-[80vh] px-4 sm:px-12 py-8 sm:py-16 bg-cover bg-center transition-all duration-700" style={hero.heroItems[hero.heroIndex] ? { backgroundImage: `url(${IMG_BASE_URL}original${hero.heroItems[hero.heroIndex].backdrop_path})` } : {}}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        <div className="relative z-10 max-w-xl">
          {hero.loading ? (
            <div className="h-40 flex items-center justify-center text-neutral-400">Loading featured content...</div>
          ) : hero.error ? (
            <div className="h-40 flex items-center justify-center text-red-500">{hero.error}</div>
          ) : hero.heroItems[hero.heroIndex] ? (
            <>
              <motion.h2
                key={hero.heroItems[hero.heroIndex].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7 }}
                className="text-3xl sm:text-5xl font-extrabold mb-4 drop-shadow-lg"
              >
                {hero.heroItems[hero.heroIndex].title || hero.heroItems[hero.heroIndex].name}
              </motion.h2>
              <motion.p
                key={hero.heroItems[hero.heroIndex].id + "desc"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-base sm:text-lg text-neutral-200 mb-6 line-clamp-4"
              >
                {hero.heroItems[hero.heroIndex].overview}
              </motion.p>
              <Button
                className="bg-[#e50914] hover:bg-[#b0060f] text-white font-bold px-6 py-3 rounded-md text-lg shadow-lg"
                onClick={() => player.openPlayer(hero.heroItems[hero.heroIndex])}
                aria-label="Play featured content"
              >
                ▶ Play Now
              </Button>
            </>
          ) : null}
        </div>
      </section>

      {/* Search Results */}
      {search.loading && (
        <div className="flex justify-center items-center py-8 text-neutral-400">Searching...</div>
      )}
      {search.error && (
        <div className="flex justify-center items-center py-8 text-red-500">{search.error}</div>
      )}
      {search.searchResults.length > 0 && !search.loading && !search.error && (
        <section className="px-4 sm:px-12 py-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Results for "{search.search}"</h3>
            <Button variant="secondary" onClick={() => search.setSearchResults([])} aria-label="Clear search results">
              <X className="mr-2" /> Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {search.searchResults.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer group"
                onClick={() => player.openPlayer(item)}
                tabIndex={0}
                role="button"
                aria-label={`Play ${item.title || item.name}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') player.openPlayer(item); }}
              >
                <div className="aspect-[2/3] bg-[#222] rounded-lg overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                  <img
                    src={`${IMG_BASE_URL}w500${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-semibold truncate">{item.title || item.name}</div>
                <div className="text-xs text-neutral-400 truncate">
                  {(item.release_date || item.first_air_date || "").slice(0, 4)} • {item.media_type === "tv" ? "TV" : "Movie"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Carousels */}
      {categories.loading && (
        <div className="flex justify-center items-center py-8 text-neutral-400">Loading categories...</div>
      )}
      {categories.error && (
        <div className="flex justify-center items-center py-8 text-red-500">{categories.error}</div>
      )}
      {Object.keys(categories.categories).map((cat) =>
        categories.categories[cat].length > 0 ? (
          <section key={cat} className="px-4 sm:px-12 py-6">
            <h3 className="text-xl sm:text-2xl font-bold mb-3">{cat}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {categories.categories[cat].map((item: any) => (
                <div
                  key={item.id}
                  className="min-w-[140px] sm:min-w-[180px] max-w-[180px] cursor-pointer group"
                  onClick={() => player.openPlayer(item)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Play ${item.title || item.name}`}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') player.openPlayer(item); }}
                >
                  <div className="aspect-[2/3] bg-[#222] rounded-lg overflow-hidden mb-2 group-hover:scale-105 transition-transform">
                    <img
                      src={`${IMG_BASE_URL}w300${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-semibold truncate text-sm sm:text-base">{item.title || item.name}</div>
                  <div className="text-xs text-neutral-400 truncate">
                    {(item.release_date || item.first_air_date || "").slice(0, 4)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null
      )}

      {/* Player Modal */}
      <AnimatePresence>
        {player.playerOpen && player.playerMedia && (
          <Dialog open={player.playerOpen} onOpenChange={player.setPlayerOpen}>
            <DialogContent className="max-w-3xl w-full bg-black rounded-lg p-0 overflow-hidden" aria-modal="true" aria-label="Player dialog">
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`${VIDSRC_BASE_URL}${player.playerMedia.media_type || (player.playerMedia.title ? "movie" : "tv")}/${player.playerMedia.id}`}
                  allowFullScreen
                  className="w-full h-full rounded-t-lg"
                  title={player.playerMedia.title || player.playerMedia.name}
                />
                <Button
                  className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                  onClick={() => player.setPlayerOpen(false)}
                  size="icon"
                  aria-label="Close player"
                >
                  <X />
                </Button>
              </div>
              {player.loading ? (
                <div className="p-4 text-neutral-400">Loading recommendations...</div>
              ) : player.error ? (
                <div className="p-4 text-red-500">{player.error}</div>
              ) : player.recommendations.length > 0 && (
                <div className="p-4 bg-[#181818]">
                  <h4 className="text-lg font-bold mb-2">More Like This</h4>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                    {player.recommendations.map((item) => (
                      <div
                        key={item.id}
                        className="min-w-[120px] max-w-[140px] cursor-pointer group"
                        onClick={() => player.openPlayer(item)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Play ${item.title || item.name}`}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') player.openPlayer(item); }}
                      >
                        <div className="aspect-[2/3] bg-[#222] rounded-lg overflow-hidden mb-1 group-hover:scale-105 transition-transform">
                          <img
                            src={`${IMG_BASE_URL}w200${item.poster_path}`}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-semibold truncate text-xs">{item.title || item.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-neutral-500 text-xs">
        &copy; {new Date().getFullYear()} Nuflix. Built by Dhairya Adroja.
      </footer>

      {/* Hide scrollbar utility */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
