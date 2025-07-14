"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  X, 
  Play, 
  Plus, 
  ThumbsUp, 
  ChevronDown,
  Volume2,
  VolumeX,
  Info,
  Bell,
  User,
  Settings,
  LogOut
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { debounce } from "lodash";

const API_KEY = "6b1e21c238152148b72e0776bc1073b3";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/";
const VIDSRC_BASE_URL = "https://vidsrc.xyz/embed/";

const CATEGORIES = [
  { title: "Trending Now", endpoint: "trending/all/week", icon: "🔥" },
  { title: "Netflix Originals", endpoint: "discover/tv?with_networks=213", icon: "🎬" },
  { title: "Top Rated Movies", endpoint: "movie/top_rated", icon: "⭐" },
  { title: "Popular TV Shows", endpoint: "tv/popular", icon: "📺" },
  { title: "Action & Adventure", endpoint: "discover/movie?with_genres=28,12", icon: "💥" },
  { title: "Comedy", endpoint: "discover/movie?with_genres=35", icon: "😂" },
  { title: "Horror", endpoint: "discover/movie?with_genres=27", icon: "👻" },
  { title: "Romance", endpoint: "discover/movie?with_genres=10749", icon: "💕" },
  { title: "Documentaries", endpoint: "discover/movie?with_genres=99", icon: "📖" },
  { title: "Sci-Fi & Fantasy", endpoint: "discover/movie?with_genres=878,14", icon: "🚀" },
  { title: "Animation", endpoint: "discover/movie?with_genres=16", icon: "🎨" },
  { title: "Crime Thrillers", endpoint: "discover/movie?with_genres=80,53", icon: "🕵️" },
];

const PROFILES = [
  { id: 1, name: "John", avatar: "👨", color: "bg-blue-600" },
  { id: 2, name: "Sarah", avatar: "👩", color: "bg-pink-600" },
  { id: 3, name: "Kids", avatar: "👶", color: "bg-yellow-600" },
];

// Custom hooks
function useHero() {
  const [heroItems, setHeroItems] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (heroItems.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroItems.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroItems]);

  return { heroItems, heroIndex, setHeroIndex, loading, error };
}

function useCategories() {
  const [categories, setCategories] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }, 300),
    []
  );

  useEffect(() => {
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
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerMedia, setPlayerMedia] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

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
    muted,
    setMuted,
  };
}

// Components
function Header({ search, onProfileSelect }: any) {
  const [scrolled, setScrolled] = useState(false);
  const [activeProfile, setActiveProfile] = useState(PROFILES[0]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/95 backdrop-blur-md' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-4">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-8"
        >
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-[#e50914] cursor-pointer">
            NUFLIX
          </h1>
          
          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex space-x-6">
            {['Home', 'TV Shows', 'Movies', 'New & Popular', 'My List'].map((item) => (
              <motion.a
                key={item}
                href="#"
                whileHover={{ scale: 1.05 }}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </motion.div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <form onSubmit={search.handleSearch} className="relative">
              <Input
                type="text"
                value={search.search}
                onChange={e => search.setSearch(e.target.value)}
                placeholder="Search..."
                className="w-40 md:w-64 pl-10 pr-4 py-2 bg-black/60 border-neutral-700 text-white rounded-full focus:ring-2 focus:ring-[#e50914] focus:border-transparent transition-all"
                onFocus={() => search.setShowSuggestions(search.search.length > 1)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            </form>
            
            {/* Search Suggestions */}
            <AnimatePresence>
              {search.showSuggestions && search.searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-md rounded-lg shadow-2xl border border-neutral-800 overflow-hidden"
                >
                  {search.searchSuggestions.map((item: any) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left"
                      onClick={() => {
                        search.setSearch(item.title || item.name);
                        search.setShowSuggestions(false);
                      }}
                    >
                      <img
                        src={`${IMG_BASE_URL}w92${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{item.title || item.name}</div>
                        <div className="text-xs text-neutral-400 truncate">
                          {(item.release_date || item.first_air_date || "").slice(0, 4)} • {item.media_type === "tv" ? "TV" : "Movie"}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell size={20} />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-white/10">
                <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${activeProfile.color}`}>
                  {activeProfile.avatar}
                </div>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black/95 backdrop-blur-md border-neutral-800">
              {PROFILES.map((profile) => (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => setActiveProfile(profile)}
                  className="flex items-center space-x-3 text-white hover:bg-white/10"
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${profile.color}`}>
                    {profile.avatar}
                  </div>
                  <span>{profile.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="text-white hover:bg-white/10">
                <Settings className="mr-2" size={16} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10">
                <LogOut className="mr-2" size={16} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}

function HeroSection({ hero, player }: any) {
  const [muted, setMuted] = useState(true);

  if (hero.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (hero.error || !hero.heroItems[hero.heroIndex]) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p>{hero.error || "No content available"}</p>
      </div>
    );
  }

  const currentItem = hero.heroItems[hero.heroIndex];

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <motion.div
        key={currentItem.id}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${IMG_BASE_URL}original${currentItem.backdrop_path})`,
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="px-4 md:px-12 max-w-2xl">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge className="mb-4 bg-[#e50914] text-white border-none">
              {currentItem.media_type === 'tv' ? 'TV Series' : 'Movie'}
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-black mb-4 text-white leading-tight">
              {currentItem.title || currentItem.name}
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-6 line-clamp-3 leading-relaxed">
              {currentItem.overview}
            </p>

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center space-x-2 text-white/80">
                <span className="text-green-400">★</span>
                <span>{currentItem.vote_average?.toFixed(1)}</span>
              </div>
              <span className="text-white/60">•</span>
              <span className="text-white/80">
                {(currentItem.release_date || currentItem.first_air_date)?.slice(0, 4)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => player.openPlayer(currentItem)}
                className="bg-white text-black hover:bg-white/90 font-bold px-8 py-3 rounded-md text-lg flex items-center space-x-2"
              >
                <Play size={20} fill="currentColor" />
                <span>Play</span>
              </Button>
              
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 font-bold px-8 py-3 rounded-md text-lg flex items-center space-x-2 backdrop-blur-sm"
              >
                <Info size={20} />
                <span>More Info</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Audio Control */}
      <Button
        onClick={() => setMuted(!muted)}
        variant="ghost"
        size="icon"
        className="absolute bottom-8 right-8 text-white hover:bg-white/20 border border-white/30"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </Button>

      {/* Hero Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        {hero.heroItems.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => hero.setHeroIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === hero.heroIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function ContentRow({ title, items, icon, player }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();
  }, [items]);

  return (
    <div className="px-4 md:px-12 py-8 group">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
      </div>
      
      <div className="relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <Button
            onClick={() => scroll('left')}
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown className="rotate-90" size={20} />
          </Button>
        )}
        
        {canScrollRight && (
          <Button
            onClick={() => scroll('right')}
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown className="-rotate-90" size={20} />
          </Button>
        )}

        {/* Content Scroll */}
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item: any) => (
            <ContentCard key={item.id} item={item} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentCard({ item, player }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="min-w-[200px] md:min-w-[250px] cursor-pointer group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-transparent border-none overflow-hidden">
        <CardContent className="p-0 relative">
          <div className="aspect-[16/9] overflow-hidden rounded-lg">
            <motion.img
              src={`${IMG_BASE_URL}w500${item.backdrop_path || item.poster_path}`}
              alt={item.title || item.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col justify-end p-4 rounded-lg"
              >
                <h3 className="text-white font-bold text-sm mb-2 line-clamp-2">
                  {item.title || item.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => player.openPlayer(item)}
                      size="sm"
                      className="bg-white text-black hover:bg-white/90 rounded-full p-2"
                    >
                      <Play size={14} fill="currentColor" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 rounded-full p-2"
                    >
                      <Plus size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 rounded-full p-2"
                    >
                      <ThumbsUp size={14} />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs text-white/80">
                    <span className="text-green-400">★</span>
                    <span>{item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlayerModal({ player }: any) {
  return (
    <Dialog open={player.playerOpen} onOpenChange={player.setPlayerOpen}>
      <DialogContent className="max-w-5xl w-full bg-black border-neutral-800 p-0 overflow-hidden">
        <div className="relative">
          {/* Video Player */}
          <div className="aspect-video bg-black">
            <iframe
              src={`${VIDSRC_BASE_URL}${player.playerMedia?.media_type || (player.playerMedia?.title ? "movie" : "tv")}/${player.playerMedia?.id}`}
              allowFullScreen
              className="w-full h-full"
              title={player.playerMedia?.title || player.playerMedia?.name}
            />
          </div>
          
          {/* Close Button */}
          <Button
            onClick={() => player.setPlayerOpen(false)}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-black/60 rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content Info */}
        <div className="p-6 bg-[#181818]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {player.playerMedia?.title || player.playerMedia?.name}
              </h2>
              <p className="text-white/80 mb-4 line-clamp-3">
                {player.playerMedia?.overview}
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-white/60">
                <span className="text-green-400">
                  ★ {player.playerMedia?.vote_average?.toFixed(1)}
                </span>
                <span>
                  {(player.playerMedia?.release_date || player.playerMedia?.first_air_date)?.slice(0, 4)}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {player.playerMedia?.media_type === 'tv' ? 'TV Series' : 'Movie'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Plus size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ThumbsUp size={20} />
              </Button>
            </div>
          </div>

          {/* Recommendations */}
          {player.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">More Like This</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {player.recommendations.slice(0, 6).map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer"
                    onClick={() => player.openPlayer(item)}
                  >
                    <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="aspect-video">
                          <img
                            src={`${IMG_BASE_URL}w300${item.backdrop_path || item.poster_path}`}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="text-white font-semibold text-sm line-clamp-1">
                            {item.title || item.name}
                          </h4>
                          <p className="text-white/60 text-xs mt-1">
                            {(item.release_date || item.first_air_date)?.slice(0, 4)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Nuflix() {
  const hero = useHero();
  const categories = useCategories();
  const search = useSearch();
  const player = usePlayer();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header search={search} />

      {/* Hero Section */}
      <HeroSection hero={hero} player={player} />

      {/* Search Results */}
      <AnimatePresence>
        {search.searchResults.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 md:px-12 py-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Results for "{search.search}"</h2>
              <Button
                onClick={() => search.setSearchResults([])}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <X className="mr-2" size={16} />
                Clear
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {search.searchResults.map((item) => (
                <ContentCard key={item.id} item={item} player={player} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Content Rows */}
      {CATEGORIES.map((category) => {
        const items = categories.categories[category.title];
        return items?.length > 0 ? (
          <ContentRow
            key={category.title}
            title={category.title}
            items={items}
            icon={category.icon}
            player={player}
          />
        ) : null;
      })}

      {/* Player Modal */}
      <PlayerModal player={player} />

      {/* Footer */}
      <footer className="px-4 md:px-12 py-12 mt-16 border-t border-neutral-800">
        <div className="text-center text-neutral-500">
          <p className="mb-2">&copy; {new Date().getFullYear()} Nuflix. Built by Dhairya Adroja.</p>
          <p className="text-sm">Powered by TMDB API</p>
        </div>
      </footer>

      {/* Global Styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}