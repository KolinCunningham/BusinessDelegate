'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, X, Star, Users, Award, Calendar, Send, Heart, Plus, 
  Shield, ExternalLink, Download, Copy, ArrowRight, Search, Navigation, Filter
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import CragMap, { type Route as MapRoute } from './components/CragMap';

// ============================================================
// SEEDED ROUTES DATA - Realistic climbing areas (US focus)
// ============================================================
const SEED_ROUTES: Route[] = [
  // Bishop / Buttermilks area (CA) - world class bouldering
  { id: 1, name: "The Birthday Problem", crag: "The Buttermilks", lat: 37.352, lng: -118.452, grade: "V4", difficulty: 4, popularity: 92, type: "Boulder", description: "Iconic highball arete. Classic Bishop testpiece with committing moves.", height: 18, stars: 4.8 },
  { id: 2, name: "The Mandala", crag: "The Buttermilks", lat: 37.353, lng: -118.451, grade: "V12", difficulty: 8, popularity: 78, type: "Boulder", description: "One of the most beautiful lines in the world. Perfect crimps and technical footwork.", height: 14, stars: 4.9 },
  { id: 3, name: "The Hulk", crag: "The Buttermilks", lat: 37.3515, lng: -118.453, grade: "V5", difficulty: 5, popularity: 65, type: "Boulder", description: "Massive overhung boulder with powerful compression.", height: 12, stars: 4.4 },
  { id: 4, name: "Lonesome Dove", crag: "The Buttermilks", lat: 37.354, lng: -118.449, grade: "V2", difficulty: 2, popularity: 81, type: "Boulder", description: "Beginner-friendly high quality slab with great landing.", height: 10, stars: 4.2 },
  
  // Happy Boulders (Bishop)
  { id: 5, name: "Big Happy", crag: "Happy Boulders", lat: 37.415, lng: -118.552, grade: "V7", difficulty: 6, popularity: 71, type: "Boulder", description: "Steep powerful classic. Amazing movement on perfect rock.", height: 11, stars: 4.6 },
  { id: 6, name: "Cross the Stream", crag: "Happy Boulders", lat: 37.416, lng: -118.551, grade: "V3", difficulty: 3, popularity: 59, type: "Boulder", description: "Fun traverse with a cruxy topout. Good warm-up.", height: 9, stars: 4.0 },
  
  // Yosemite Valley
  { id: 7, name: "Royal Arches", crag: "Yosemite Valley", lat: 37.732, lng: -119.605, grade: "5.10a", difficulty: 5, popularity: 88, type: "Trad", description: "Classic Yosemite multipitch. Incredible position over the valley.", height: 380, stars: 4.7 },
  { id: 8, name: "The Nose - El Cap", crag: "Yosemite Valley", lat: 37.728, lng: -119.635, grade: "5.13b", difficulty: 9, popularity: 95, type: "Trad", description: "The most famous big wall in the world. Ultimate test of endurance.", height: 2900, stars: 4.9 },
  { id: 9, name: "Separate Reality", crag: "Yosemite Valley", lat: 37.745, lng: -119.58, grade: "5.12a", difficulty: 7, popularity: 67, type: "Sport", description: "Famous roof crack with wild exposure. Incredible photos.", height: 60, stars: 4.5 },
  
  // Smith Rock (OR)
  { id: 10, name: "Tactical Nuclear Penguin", crag: "Smith Rock", lat: 44.365, lng: -121.145, grade: "5.13c", difficulty: 8, popularity: 54, type: "Sport", description: "Technical masterpiece on the famous tuff. Incredible movement.", height: 50, stars: 4.8 },
  { id: 11, name: "To Bolt or Not to Be", crag: "Smith Rock", lat: 44.364, lng: -121.147, grade: "5.14a", difficulty: 9, popularity: 42, type: "Sport", description: "Historic first 5.14 in the US. Powerful and sustained.", height: 45, stars: 4.6 },
  { id: 12, name: "Morning Glory Wall", crag: "Smith Rock", lat: 44.368, lng: -121.142, grade: "5.10d", difficulty: 5, popularity: 76, type: "Sport", description: "The best moderate sport climbing at Smith. Sunny and fun.", height: 90, stars: 4.3 },
  
  // Red Rock Canyon (NV)
  { id: 13, name: "Crimson Chrysalis", crag: "Red Rock Canyon", lat: 36.158, lng: -115.432, grade: "5.8", difficulty: 3, popularity: 84, type: "Trad", description: "Classic 5.8 multipitch splitter. Perfect introduction to Red Rock.", height: 450, stars: 4.5 },
  { id: 14, name: "Solar Slab", crag: "Red Rock Canyon", lat: 36.162, lng: -115.435, grade: "5.6", difficulty: 1, popularity: 79, type: "Trad", description: "Long moderate classic. Amazing views of the desert.", height: 650, stars: 4.4 },
  
  // Hueco Tanks (TX)
  { id: 15, name: "Full Monty", crag: "Hueco Tanks", lat: 31.922, lng: -106.045, grade: "V8", difficulty: 7, popularity: 61, type: "Boulder", description: "The signature problem at Hueco. Incredible roof and compression.", height: 13, stars: 4.7 },
  { id: 16, name: "Planet of the Apes", crag: "Hueco Tanks", lat: 31.924, lng: -106.043, grade: "V5", difficulty: 5, popularity: 57, type: "Boulder", description: "Powerful roof with a wild throw. Hueco classic.", height: 10, stars: 4.3 },
  
  // Joe's Valley (UT)
  { id: 17, name: "The Angler", crag: "Joe's Valley", lat: 39.295, lng: -110.92, grade: "V6", difficulty: 6, popularity: 48, type: "Boulder", description: "Technical masterpiece in a beautiful Utah canyon.", height: 12, stars: 4.1 },
  { id: 18, name: "Choke the Chicken", crag: "Joe's Valley", lat: 39.293, lng: -110.918, grade: "V4", difficulty: 4, popularity: 52, type: "Boulder", description: "Fun powerful classic with great holds.", height: 9, stars: 4.0 },
];

// Haversine distance in miles
function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getGradeColor(grade: string): string {
  const g = grade.toUpperCase();
  if (g.includes('V0') || g.includes('V1') || g.includes('5.6') || g.includes('5.7') || g.includes('5.8') || g.includes('5.9')) return '#22c55e';
  if (g.includes('V2') || g.includes('V3') || g.includes('V4') || g.includes('5.10')) return '#eab308';
  if (g.includes('V5') || g.includes('V6') || g.includes('5.11')) return '#f97316';
  if (g.includes('V7') || g.includes('V8') || g.includes('V9') || g.includes('5.12') || g.includes('5.13')) return '#ef4444';
  return '#8b5cf6';
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span 
      className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold text-white tracking-tight shadow"
      style={{ backgroundColor: getGradeColor(grade) }}
    >
      {grade}
    </span>
  );
}

export default function CragTrails() {
  // Core state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [showModalFor, setShowModalFor] = useState<Route | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filtered + sorted routes (drives BOTH list and map markers)
  const filteredRoutes = useMemo(() => {
    let result = [...SEED_ROUTES];

    // Search filter (real-time, affects map + list)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.crag.toLowerCase().includes(q) ||
          r.grade.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }

    // Near Me filter (50 miles)
    if (userLocation) {
      result = result.filter((r) => {
        const dist = getDistanceMiles(userLocation.lat, userLocation.lng, r.lat, r.lng);
        return dist <= 50;
      });
    }

    // Sort: popularity desc, then name
    result.sort((a, b) => {
      if (b.popularity !== a.popularity) return b.popularity - a.popularity;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [searchTerm, userLocation]);

  const selectedRoute = useMemo(
    () => SEED_ROUTES.find((r) => r.id === selectedRouteId) || null,
    [selectedRouteId]
  );

  // Handle marker or list click -> preview + select
  const handleRouteSelect = useCallback((route: Route) => {
    setSelectedRouteId(route.id);
    
    // Fly the map to the route (updates dynamic map via props)
    setMapCenter([route.lat, route.lng]);
    setMapZoom(14); // close zoom for detail

    // Gentle toast hint
    toast.success(`Centered on ${route.name}`, { duration: 1200 });
  }, []);

  // Real "Near Me" - centers map + filters list to 50mi radius
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude };

        setUserLocation(newLoc);
        setMapCenter([latitude, longitude]);
        setMapZoom(9); // Regional view showing ~50mi radius nicely

        setIsLocating(false);
        
        toast.success("Near Me active — showing routes within 50 miles", {
          description: "Clear filter with the × button",
          duration: 2600,
        });
      },
      (err) => {
        setIsLocating(false);
        toast.error("Could not get your location", {
          description: err.message || "Please allow location access and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const clearNearMe = useCallback(() => {
    setUserLocation(null);
    setMapCenter(undefined);
    setMapZoom(undefined);
    toast.info("Near Me filter cleared");
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setUserLocation(null);
    setSelectedRouteId(null);
    setMapCenter(undefined);
    setMapZoom(undefined);
    toast.info("All filters cleared");
  }, []);

  // Open full modal from preview card
  const openFullModal = (route: Route) => {
    setShowModalFor(route);
  };

  const closeModal = () => setShowModalFor(null);

  // SUPER KID + GRANDMA FRIENDLY SEND IT (big joyful celebration!)
  const logAscent = (route: Route) => {
    const friendlyGrade = getFriendlyGrade(route.grade);
    const cheers = [
      "WHOA! YOU CRUSHED IT! 🌲🧗",
      "YESS!!! First outdoor send in the books!",
      "AWESOME JOB! You're officially a legend.",
      "HIGH FIVE! That was SO cool!",
    ];
    const cheer = cheers[Math.floor(Math.random() * cheers.length)];
    
    toast.success(cheer, {
      description: `You just sent ${route.name} (${friendlyGrade}) at ${route.crag}! Amazing work. Tell everyone!`,
      duration: 5200,
    });
    // In real app this would save to your personal logbook with photo + notes
  };

  // Translate scary numbers into words a 10-year-old (or grandma) instantly gets
  function getFriendlyGrade(grade: string): string {
    const g = grade.toUpperCase();
    if (g.includes('V0') || g.includes('V1') || g.includes('5.6') || g.includes('5.7') || g.includes('5.8')) return "Super easy starter — most kids send this on their first or second try!";
    if (g.includes('V2') || g.includes('V3') || g.includes('5.9') || g.includes('5.10')) return "A little tricky but tons of fun — perfect for your second or third outdoor day!";
    if (g.includes('V4') || g.includes('V5') || g.includes('5.11')) return "Pretty hard — strong climbers love this one. You got strong moves!";
    if (g.includes('V6') || g.includes('V7') || g.includes('5.12')) return "Really tough! This is hard for most grown-up adults. You're a beast!";
    if (g.includes('V8') || g.includes('V9') || g.includes('5.13')) return "Extremely hard — only the strongest climbers send these. Wow!";
    return "Expert level challenge — you're in the big leagues now!";
  }

  // Mini preview card (appears when marker/list item selected)
  const MiniPreview = selectedRoute && (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1100] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GradeBadge grade={selectedRoute.grade} />
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">{selectedRoute.type}</span>
          </div>
          <div className="font-semibold text-lg leading-tight tracking-tight text-black dark:text-white">{selectedRoute.name}</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{selectedRoute.crag}</div>
        </div>
        <button onClick={() => setSelectedRouteId(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm">
        <div className="flex items-center gap-1 text-amber-500">
          <Star size={15} fill="currentColor" /> <span className="font-medium text-black dark:text-white">{selectedRoute.stars}</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <Users size={15} /> <span>{selectedRoute.popularity} sends</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => openFullModal(selectedRoute)}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-semibold active:scale-[0.985] transition"
        >
          Full details <ArrowRight size={16} />
        </button>
        <button
          onClick={() => {
            setMapCenter([selectedRoute.lat, selectedRoute.lng]);
            setMapZoom(15);
          }}
          className="px-4 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium"
        >
          Recenter
        </button>
      </div>
    </motion.div>
  );

  // Full route modal
  const FullModal = (
    <AnimatePresence>
      {showModalFor && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4" onClick={closeModal}>
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.22 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <GradeBadge grade={showModalFor.grade} />
                  <div className="text-2xl font-semibold tracking-tighter mt-2">{showModalFor.name}</div>
                  <div className="text-zinc-500 dark:text-zinc-400 mt-0.5">{showModalFor.crag} • {showModalFor.type}</div>
                </div>
                <button onClick={closeModal} className="p-1 -mr-1 text-zinc-400 hover:text-black dark:hover:text-white"><X /></button>
              </div>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <div>
                <div className="uppercase text-xs tracking-[1px] text-zinc-500 mb-1 font-medium">Description</div>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{showModalFor.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-3">
                  <div className="text-xs text-zinc-500">Grade</div>
                  <div className="font-semibold text-xl mt-0.5" style={{color: getGradeColor(showModalFor.grade)}}>{showModalFor.grade}</div>
                </div>
                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-3">
                  <div className="text-xs text-zinc-500">Height</div>
                  <div className="font-semibold text-xl mt-0.5">{showModalFor.height || '—'} ft</div>
                </div>
                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-3">
                  <div className="text-xs text-zinc-500">Popularity</div>
                  <div className="font-semibold text-xl mt-0.5">{showModalFor.popularity}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <div>COMMUNITY RATING</div>
                  <div className="flex text-amber-500"><Star size={14} fill="currentColor" /><span className="ml-1 text-black dark:text-white font-medium">{showModalFor.stars}</span></div>
                </div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500" style={{ width: `${(showModalFor.stars / 5) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => logAscent(showModalFor)} 
                className="flex-1 rounded-2xl bg-black dark:bg-white text-white dark:text-black py-3 font-semibold flex items-center justify-center gap-2 active:opacity-90"
              >
                <Award size={18} /> Log this ascent
              </button>
              <button 
                onClick={() => {
                  handleRouteSelect(showModalFor);
                  closeModal();
                }} 
                className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-700 py-3 font-medium"
              >
                Fly to on map
              </button>
            </div>

            {/* Bonus offline note in context */}
            <div className="px-6 pb-6 text-[10px] text-center text-zinc-400 font-mono tracking-tight">
              Route beta &amp; conditions best checked on-site or via local guides.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const currentCenter = mapCenter;
  const currentZoom = mapZoom;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <MapPin className="text-white" size={18} />
              </div>
              <div>
                <div className="font-semibold tracking-[-1.2px] text-2xl">CragTrails</div>
                <div className="text-[9px] text-zinc-500 -mt-1">CLIMB • DISCOVER • CONNECT</div>
              </div>
            </div>
          </div>

          {/* Global search - filters map + list in real time */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-zinc-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search routes, crags, grades (V4, 5.12...)"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-11 pr-9 py-2.5 rounded-2xl text-sm placeholder:text-zinc-400 focus:outline-none focus:border-black dark:focus:border-white"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-zinc-400 hover:text-black">
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href="/admin" 
              className="px-4 py-2 rounded-2xl border border-[#2f5d3d] hover:bg-[#2f5d3d] hover:text-white text-sm font-medium flex items-center gap-1.5 text-[#2f5d3d] transition"
            >
              <Shield size={15} /> Admin
            </Link>

            <button
              onClick={userLocation ? clearNearMe : handleNearMe}
              disabled={isLocating}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border transition active:scale-[0.985] ${
                userLocation 
                  ? 'border-red-200 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 dark:border-red-900' 
                  : 'border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-950'
              }`}
            >
              <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
              {userLocation ? 'Clear 50mi' : 'Near Me'}
            </button>

            <button 
              onClick={clearAllFilters} 
              className="px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-950 text-sm font-medium flex items-center gap-1.5"
            >
              <Filter size={15} /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 pt-6 pb-12">
        {/* Hero / Explanation */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-xs font-mono tracking-[2px] text-emerald-600 dark:text-emerald-400 mb-1">MAP-FIRST CLIMBING DISCOVERY</div>
              <h1 className="text-5xl font-semibold tracking-[-3.2px]">Find your next send.</h1>
            </div>
            <div className="text-sm max-w-md text-zinc-600 dark:text-zinc-400">
              Interactive map + live list. See exactly what’s on the way to the crag.
            </div>
          </div>
        </div>

        {/* Why map + list hybrid section (the proof requested) */}
        <div className="mb-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 text-sm">
          <div className="uppercase font-mono tracking-widest text-xs mb-2 text-emerald-600">WHY THIS BEATS PURE LIST OR PURE MAP</div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div>
              <strong className="text-black dark:text-white">AllTrails proved it:</strong> The world’s most successful outdoor discovery app is a hybrid. 
              Pure lists are fast to scan but hide spatial relationships. Pure maps are beautiful but terrible for scanning 40 routes by name or quickly comparing grades.
            </div>
            <div>
              <strong className="text-black dark:text-white">Climber use case — “What’s on the way?”</strong><br />
              You’re driving from Bishop to Yosemite. A pure list shows you nothing about the 4 incredible boulders 11 miles off the 395 that you’d otherwise drive right past. 
              The map + live list hybrid surfaces those opportunities instantly. Click any marker, preview the mini-card, decide to detour, or filter the list to only 50mi radius when you arrive.
            </div>
          </div>
          <div className="text-[11px] mt-3 text-zinc-400">Clustering at low zoom shows density. Larger markers = popular routes. Color = objective difficulty at a glance.</div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-sm mb-3 px-1">
          <div className="font-medium">
            {filteredRoutes.length} routes 
            {userLocation && <span className="text-emerald-600"> • within 50 miles</span>}
            {searchTerm && <span className="text-emerald-600"> • matching “{searchTerm}”</span>}
          </div>
          <div className="text-zinc-500 hidden md:block">Click markers or list items • Search &amp; Near Me update everything live</div>
        </div>

        {/* HYBRID MAIN VIEW: List + Map side-by-side */}
        <div className="grid lg:grid-cols-5 gap-4 h-[640px]">
          {/* LIST PANEL (synced) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="font-semibold flex items-center gap-2">
                Routes <span className="text-xs font-normal px-2 py-px rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500">{filteredRoutes.length}</span>
              </div>
              {userLocation && (
                <div className="text-xs px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1">
                  <Navigation size={12} /> 50mi radius
                </div>
              )}
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm custom-scroll">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => {
                  const dist = userLocation 
                    ? getDistanceMiles(userLocation.lat, userLocation.lng, route.lat, route.lng).toFixed(0) 
                    : null;
                  const isActive = selectedRouteId === route.id;

                  return (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelect(route)}
                      className={`w-full text-left p-3.5 rounded-2xl border flex flex-col gap-1.5 transition active:scale-[0.995] ${
                        isActive 
                          ? 'border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 shadow' 
                          : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-semibold tracking-tight">{route.name}</div>
                        <GradeBadge grade={route.grade} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">{route.crag} • {route.type}</span>
                        {dist && <span className="font-mono text-emerald-600">{dist} mi</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-px"><Star size={12} className="text-amber-500" fill="currentColor" /> {route.stars}</span>
                        <span>{route.popularity} sends</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-zinc-500">No routes match your filters. Try clearing search or Near Me.</div>
              )}
            </div>

            {/* Quick actions footer */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs flex gap-2">
              <button onClick={handleNearMe} className="flex-1 py-2 rounded-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 active:bg-zinc-100">Use my location</button>
              <button onClick={clearAllFilters} className="flex-1 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 active:bg-zinc-100">Clear everything</button>
            </div>
          </div>

          {/* MAP PANEL - Full interactive view with all features */}
          <div className="lg:col-span-3 relative h-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner bg-black">
            <CragMap
              routes={filteredRoutes}           // Live filtered data
              selectedRouteId={selectedRouteId}
              onMarkerClick={handleRouteSelect}
              center={currentCenter}
              zoom={currentZoom}
            />

            {/* Floating mini preview card (marker -> preview -> modal flow) */}
            <AnimatePresence>{MiniPreview}</AnimatePresence>

            {/* Subtle instruction overlay */}
            <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 text-xs bg-white/90 dark:bg-zinc-950/90 px-4 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 font-mono tracking-tight shadow z-[900]">
              Click markers to preview • Clusters expand on zoom
            </div>
          </div>
        </div>

        {/* Footer / integration notes */}
        <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-tight max-w-2xl mx-auto">
          Built with Leaflet + React-Leaflet + Next.js dynamic import (ssr: false). 
          No API keys. Fully client-side after hydration. All filters update map markers instantly.
        </div>
      </main>
      
      {FullModal}
    </div>
  );
}
