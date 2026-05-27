'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Star, Heart, Send, User, BookOpen, Compass, 
  X, ChevronLeft, ChevronRight, Calendar, Award 
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// ==================== TYPES ====================
interface Route {
  id: number;
  name: string;
  crag: string;
  area: string;
  grade: string;
  type: 'Sport' | 'Trad' | 'Boulder' | 'Mixed';
  length: number;
  bolts: number;
  rating: number;
  sends: number;
  lat: number;
  lng: number;
  beta: string;
  conditions: Array<{ emoji: string; report: string; user: string }>;
  photos: string[]; // picsum urls for real-feel stock
}

interface SendLog {
  id: number;
  routeId: number;
  name: string;
  grade: string;
  crag: string;
  date: string;
}

type Tab = 'discover' | 'map' | 'logbook' | 'me';

// ==================== MOCK DATA — REALISTIC + FUN ====================
const MOCK_ROUTES: Route[] = [
  {
    id: 1,
    name: "Serenity Crack",
    crag: "Yosemite Valley",
    area: "El Capitan",
    grade: "5.10d",
    type: "Trad",
    length: 120,
    bolts: 0,
    rating: 4.9,
    sends: 312,
    lat: 37.745,
    lng: -119.593,
    beta: "Finger jam the whole way. The crux is a perfect 5.10 lieback after the first roof. Pure Yosemite magic!",
    conditions: [
      { emoji: "🟢", report: "Bone dry, perfect jams. Send weather all week.", user: "Alex S." },
      { emoji: "🟡", report: "A bit sandy low, bomber up high.", user: "Jordan K." },
    ],
    photos: [
      "https://picsum.photos/id/1016/800/600",
      "https://picsum.photos/id/1005/800/600",
      "https://picsum.photos/id/160/800/600",
    ],
  },
  {
    id: 2,
    name: "Midnight Lightning",
    crag: "Yosemite Valley",
    area: "Camp 4",
    grade: "V8",
    type: "Boulder",
    length: 18,
    bolts: 0,
    rating: 4.8,
    sends: 187,
    lat: 37.746,
    lng: -119.602,
    beta: "The most famous boulder problem in the world. Dyno or heel-hook the lip. One move wonder that feels impossible until it isn't.",
    conditions: [
      { emoji: "🟢", report: "Perfect friction tonight. Send train happening!", user: "Sam B." },
      { emoji: "🔴", report: "Super humid. Wait for cooler evening.", user: "Taylor M." },
    ],
    photos: [
      "https://picsum.photos/id/251/800/600",
      "https://picsum.photos/id/29/800/600",
      "https://picsum.photos/id/201/800/600",
    ],
  },
  {
    id: 3,
    name: "Astro Man",
    crag: "Yosemite Valley",
    area: "Royal Arches",
    grade: "5.11c",
    type: "Sport",
    length: 85,
    bolts: 11,
    rating: 4.7,
    sends: 94,
    lat: 37.732,
    lng: -119.581,
    beta: "Sustained crimps and big reaches. Rest on the ledge before the final 5.11 roof. Super fun!",
    conditions: [
      { emoji: "🟢", report: "Dry as a bone. Incredible movement.", user: "Casey R." },
    ],
    photos: [
      "https://picsum.photos/id/30/800/600",
      "https://picsum.photos/id/160/800/600",
      "https://picsum.photos/id/1018/800/600",
    ],
  },
  {
    id: 4,
    name: "Separate Reality",
    crag: "Yosemite Valley",
    area: "Royal Arches",
    grade: "5.12a",
    type: "Trad",
    length: 60,
    bolts: 0,
    rating: 4.9,
    sends: 67,
    lat: 37.733,
    lng: -119.579,
    beta: "The famous roof crack. Hands in the crack, feet on the face. Pure terror and joy in 40 feet.",
    conditions: [
      { emoji: "🟢", report: "Clean and dry. Go get it!", user: "Morgan P." },
    ],
    photos: [
      "https://picsum.photos/id/1005/800/600",
      "https://picsum.photos/id/251/800/600",
      "https://picsum.photos/id/29/800/600",
    ],
  },
  {
    id: 5,
    name: "The Hulk",
    crag: "Bishop",
    area: "Happy Boulders",
    grade: "V7",
    type: "Boulder",
    length: 22,
    bolts: 0,
    rating: 4.6,
    sends: 143,
    lat: 37.363,
    lng: -118.394,
    beta: "Massive huecos and a wild heel-hook finish. Feels like you're climbing a spaceship.",
    conditions: [
      { emoji: "🟢", report: "Amazing conditions this morning.", user: "Riley T." },
      { emoji: "🟡", report: "Windy but solid holds.", user: "Devon L." },
    ],
    photos: [
      "https://picsum.photos/id/201/800/600",
      "https://picsum.photos/id/30/800/600",
      "https://picsum.photos/id/1016/800/600",
    ],
  },
  {
    id: 6,
    name: "High Plains Drifter",
    crag: "Bishop",
    area: "Buttermilks",
    grade: "5.10b",
    type: "Sport",
    length: 95,
    bolts: 9,
    rating: 4.5,
    sends: 221,
    lat: 37.355,
    lng: -118.401,
    beta: "Long and pumpy on perfect patina. One of the best 5.10s anywhere. Great warm-up.",
    conditions: [
      { emoji: "🟢", report: "Perfect patina day. Feels like 5.9 today.", user: "Jamie H." },
    ],
    photos: [
      "https://picsum.photos/id/160/800/600",
      "https://picsum.photos/id/1005/800/600",
      "https://picsum.photos/id/251/800/600",
    ],
  },
  {
    id: 7,
    name: "The Shaft",
    crag: "Joshua Tree",
    area: "Hidden Valley",
    grade: "5.9",
    type: "Trad",
    length: 70,
    bolts: 0,
    rating: 4.4,
    sends: 298,
    lat: 33.873,
    lng: -115.901,
    beta: "Classic JTree splitter. Hands, feet, smiles. The best easy trad in the park.",
    conditions: [
      { emoji: "🟢", report: "Classic splitter perfection.", user: "Pat K." },
    ],
    photos: [
      "https://picsum.photos/id/29/800/600",
      "https://picsum.photos/id/201/800/600",
      "https://picsum.photos/id/30/800/600",
    ],
  },
  {
    id: 8,
    name: "Walk on the Moon",
    crag: "Joshua Tree",
    area: "Intersection Rock",
    grade: "5.12b",
    type: "Sport",
    length: 55,
    bolts: 7,
    rating: 4.8,
    sends: 51,
    lat: 33.875,
    lng: -115.898,
    beta: "Thin crimps and delicate feet on bullet hard rock. Feels like you're floating.",
    conditions: [
      { emoji: "🟡", report: "Slightly warm but still great.", user: "Lee S." },
    ],
    photos: [
      "https://picsum.photos/id/251/800/600",
      "https://picsum.photos/id/1016/800/600",
      "https://picsum.photos/id/160/800/600",
    ],
  },
  {
    id: 9,
    name: "White Rastafarian",
    crag: "Joshua Tree",
    area: "Hidden Valley",
    grade: "V5",
    type: "Boulder",
    length: 14,
    bolts: 0,
    rating: 4.7,
    sends: 176,
    lat: 33.871,
    lng: -115.903,
    beta: "The iconic highball. Tall, proud, and surprisingly friendly on good feet.",
    conditions: [
      { emoji: "🟢", report: "Great landing and perfect rock.", user: "Quinn F." },
    ],
    photos: [
      "https://picsum.photos/id/30/800/600",
      "https://picsum.photos/id/29/800/600",
      "https://picsum.photos/id/1005/800/600",
    ],
  },
  {
    id: 10,
    name: "To Bolt or Not to Be",
    crag: "Smith Rock",
    area: "Morning Glory Wall",
    grade: "5.14a",
    type: "Sport",
    length: 80,
    bolts: 14,
    rating: 4.9,
    sends: 29,
    lat: 44.365,
    lng: -121.148,
    beta: "The route that changed sport climbing forever. Desperate, beautiful, legendary.",
    conditions: [
      { emoji: "🟢", report: "Rarely this dry. Historic conditions.", user: "Drew W." },
    ],
    photos: [
      "https://picsum.photos/id/1016/800/600",
      "https://picsum.photos/id/160/800/600",
      "https://picsum.photos/id/251/800/600",
    ],
  },
  {
    id: 11,
    name: "Tombstone Terror",
    crag: "Red Rock",
    area: "First Pullout",
    grade: "5.11a",
    type: "Sport",
    length: 65,
    bolts: 8,
    rating: 4.3,
    sends: 134,
    lat: 36.152,
    lng: -115.428,
    beta: "Big holds, big moves, big exposure. Classic Red Rock fun on amazing rock.",
    conditions: [
      { emoji: "🟢", report: "Perfect temps. Go crush!", user: "Skye B." },
    ],
    photos: [
      "https://picsum.photos/id/201/800/600",
      "https://picsum.photos/id/29/800/600",
      "https://picsum.photos/id/30/800/600",
    ],
  },
];

// ==================== HELPERS ====================
function getGradeClass(grade: string): string {
  const g = grade.toUpperCase();
  if (g.startsWith('V')) {
    const num = parseInt(g.replace('V', '')) || 0;
    if (num <= 4) return 'green';
    if (num <= 7) return 'orange';
    return 'red';
  }
  // Rope grades
  if (g.includes('5.')) {
    const after = g.split('5.')[1] || '';
    const num = parseFloat(after);
    if (num <= 8) return 'green';
    if (num <= 11) return 'orange';
    return 'red';
  }
  return 'green';
}

function getTypeEmoji(type: string): string {
  if (type === 'Sport') return '🧗';
  if (type === 'Trad') return '⚓';
  if (type === 'Boulder') return '🪨';
  return '🧗';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== CONFETTI COMPONENT (playful & lightweight) ====================
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  
  const colors = ['#16A34A', '#EA580C', '#DC2626', '#FBBF24', '#22C55E'];
  
  return (
    <div className="confetti-container">
      {Array.from({ length: 28 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 0.9 + Math.random() * 0.6;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 7;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: '-10%',
              width: size,
              height: size,
              backgroundColor: color,
            }}
            initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: 340 + Math.random() * 60,
              x: (Math.random() - 0.5) * 140,
              rotate: (Math.random() - 0.5) * 280,
              opacity: 0,
            }}
            transition={{
              duration,
              delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        );
      })}
    </div>
  );
}

// ==================== DYNAMIC MAP (SSR safe) ====================
function CragTrailsMap({ 
  routes, 
  userLocation, 
  onRouteSelect 
}: { 
  routes: Route[]; 
  userLocation: { lat: number; lng: number } | null; 
  onRouteSelect: (route: Route) => void;
}) {
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [Popup, setPopup] = useState<any>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapContainer(() => mod.MapContainer);
      setTileLayer(() => mod.TileLayer);
      setMarker(() => mod.Marker);
      setPopup(() => mod.Popup);
    });
    import('leaflet').then((mod) => {
      const leaflet = mod.default;
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });
  }, []);

  if (!MapContainer || !TileLayer || !Marker || !Popup) {
    return (
      <div className="h-[460px] rounded-3xl bg-[#F1F5F9] flex items-center justify-center text-[#4B5563]">
        Loading beautiful map…
      </div>
    );
  }

  const crags = Array.from(
    new Map(routes.map(r => [`${r.crag}`, { name: r.crag, lat: r.lat, lng: r.lng, routes: routes.filter(x => x.crag === r.crag) }])).values()
  );

  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [37.6, -119.0];

  return (
    <div className="rounded-3xl overflow-hidden border border-[#E5E7EB] h-[460px] relative">
      <MapContainer
        center={center}
        zoom={userLocation ? 10 : 7}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {crags.map((crag, idx) => {
          const popularRoute = crag.routes.sort((a, b) => b.sends - a.sends)[0];
          return (
            <Marker key={idx} position={[crag.lat, crag.lng]}>
              <Popup closeButton={false}>
                <div className="min-w-[210px] p-1">
                  <div className="font-extrabold text-xl tracking-tight mb-0.5">{crag.name}</div>
                  <div className="text-sm text-[#4B5563] mb-3">{crag.routes.length} routes here</div>
                  
                  <div 
                    onClick={() => onRouteSelect(popularRoute)}
                    className="flex items-center justify-center gap-2 bg-[#16A34A] active:bg-[#15803D] text-white font-extrabold py-3 px-5 rounded-2xl text-[15px] cursor-pointer active:scale-[0.985] transition"
                  >
                    <Send size={17} /> OPEN HOTTEST ROUTE
                  </div>
                  <div className="text-[11px] text-center mt-2 text-[#4B5563] font-medium">
                    {popularRoute.name} • {popularRoute.grade}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here!</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

const DynamicMap = dynamic(() => Promise.resolve(CragTrailsMap), { ssr: false });

// ==================== MAIN APP ====================
export default function CragTrails() {
  const [currentTab, setCurrentTab] = useState<Tab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const [routes] = useState<Route[]>(MOCK_ROUTES);
  const [mySends, setMySends] = useState<SendLog[]>([
    { id: 101, routeId: 1, name: "Serenity Crack", grade: "5.10d", crag: "Yosemite Valley", date: "2026-05-18T10:20:00Z" },
    { id: 102, routeId: 7, name: "The Shaft", grade: "5.9", crag: "Joshua Tree", date: "2026-05-21T16:45:00Z" },
  ]);
  const [savedRouteIds, setSavedRouteIds] = useState<Set<number>>(new Set([2, 5]));

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasJustSent, setHasJustSent] = useState(false);

  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.crag.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q)
      );
    }

    if (userLocation) {
      result = result.sort((a, b) => {
        const da = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const db = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return da - db;
      });
    } else {
      result.sort((a, b) => (b.rating * 100 + b.sends) - (a.rating * 100 + a.sends));
    }
    return result;
  }, [routes, searchQuery, userLocation]);

  const totalSends = mySends.length;
  const uniqueCrags = new Set(mySends.map(s => s.crag)).size;
  const maxGrade = mySends.length > 0 
    ? mySends.sort((a, b) => b.grade.localeCompare(a.grade))[0].grade 
    : "V3";

  const isRouteSent = (routeId: number) => mySends.some(s => s.routeId === routeId);

  const handleFindNearMe = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      setTimeout(() => {
        setUserLocation({ lat: 37.745, lng: -119.59 });
        setIsLocating(false);
        toast.success("Using Yosemite Valley as demo location 📍", { duration: 2400 });
      }, 420);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        toast.success("Found you! Showing routes near you 🧗", { duration: 2200 });
      },
      () => {
        setUserLocation({ lat: 37.745, lng: -119.59 });
        setIsLocating(false);
        toast("Using Yosemite Valley demo location (allow location for real)", { duration: 2800 });
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const clearLocation = () => {
    setUserLocation(null);
    toast.info("Showing all routes again");
  };

  const openRoute = (route: Route) => {
    setSelectedRoute(route);
    setCarouselIndex(0);
    setHasJustSent(false);
    setShowConfetti(false);
  };

  const closeModal = () => {
    setSelectedRoute(null);
    setShowConfetti(false);
    setHasJustSent(false);
    setTimeout(() => setCarouselIndex(0), 180);
  };

  const handleSendIt = (route: Route) => {
    if (isRouteSent(route.id)) {
      toast("You already sent this one! 🔥", { description: "Go find another adventure" });
      return;
    }

    setShowConfetti(true);

    const newSend: SendLog = {
      id: Date.now(),
      routeId: route.id,
      name: route.name,
      grade: route.grade,
      crag: route.crag,
      date: new Date().toISOString(),
    };
    setMySends(prev => [newSend, ...prev]);
    setHasJustSent(true);

    toast.success(`SEND LOGGED! 🎉`, {
      description: `${route.name} • ${route.grade} — You're unstoppable!`,
      duration: 3200,
    });

    setTimeout(() => {
      setShowConfetti(false);
    }, 1350);

    setTimeout(() => {
      closeModal();
      setCurrentTab('logbook');
    }, 1850);
  };

  const toggleSave = (routeId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setSavedRouteIds(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
        toast("Removed from saved");
      } else {
        next.add(routeId);
        toast.success("Saved for later ❤️", { description: "Find it anytime in your collection" });
      }
      return next;
    });
  };

  const isSaved = (id: number) => savedRouteIds.has(id);

  const nextPhoto = () => {
    if (!selectedRoute) return;
    setCarouselIndex((prev) => (prev + 1) % selectedRoute.photos.length);
  };
  const prevPhoto = () => {
    if (!selectedRoute) return;
    setCarouselIndex((prev) => (prev - 1 + selectedRoute.photos.length) % selectedRoute.photos.length);
  };

  const RouteCard = ({ route }: { route: Route }) => {
    const distance = userLocation 
      ? calculateDistance(userLocation.lat, userLocation.lng, route.lat, route.lng) 
      : null;
    const gradeClass = getGradeClass(route.grade);

    return (
      <div 
        onClick={() => openRoute(route)} 
        className="route-card"
      >
        <div 
          className="card-photo"
          style={{ backgroundImage: `url(${route.photos[0]})` }}
        >
          <div className="absolute top-4 right-4 z-10">
            <div className={`grade-pill ${gradeClass}`}>
              {route.grade}
            </div>
          </div>

          <button
            onClick={(e) => toggleSave(route.id, e)}
            className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center active:scale-95 transition"
          >
            <Heart 
              size={18} 
              className={isSaved(route.id) ? "fill-[#EA580C] text-[#EA580C]" : "text-[#4B5563]"} 
            />
          </button>

          <div className="relative z-10 p-4 w-full">
            <div className="text-white">
              <div className="font-extrabold text-[21px] tracking-[-0.5px] leading-none mb-1 drop-shadow">
                {route.name}
              </div>
              <div className="flex items-center gap-2 text-[14px] font-semibold opacity-95">
                {route.crag} <span className="opacity-60">•</span> {route.area}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-[#FBBF24]">
              <Star size={17} fill="currentColor" />
            </div>
            <span className="font-extrabold text-[15px] tabular-nums">{route.rating}</span>
            <span className="text-[#4B5563] font-semibold text-[14px]">• {route.sends} sends</span>
          </div>

          {distance !== null && (
            <div className="text-xs font-bold px-3 py-1 bg-[#F1F5F9] rounded-full text-[#16A34A]">
              {distance} mi
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDiscover = () => (
    <div className="pb-28 px-4 pt-5">
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="text-4xl">🧗</div>
          <div>
            <div className="text-hero tracking-[-1.2px]">CragTrails</div>
            <div className="text-[#4B5563] -mt-1 font-semibold">Climb everywhere. Send everything.</div>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-6 top-5.5 text-[#9CA3AF]" size={23} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search routes or crags…"
          className="huge-search w-full text-[#111827] placeholder:text-[#9CA3AF]"
        />
      </div>

      <button 
        onClick={handleFindNearMe}
        disabled={isLocating}
        className="find-near-btn w-full mb-5 active:scale-[0.985]"
      >
        <MapPin size={23} />
        {isLocating ? "FINDING YOUR CRAGS..." : "Find crags near me"}
      </button>

      {userLocation && (
        <div className="mb-4 flex items-center justify-between bg-[#F0FDF4] border border-[#BBF7D0] rounded-3xl px-5 py-3">
          <div className="font-bold text-[#166534] flex items-center gap-2">
            📍 Near you — sorted by distance
          </div>
          <button 
            onClick={clearLocation} 
            className="text-[#166534] font-bold text-sm underline active:opacity-70"
          >
            Show all
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map(route => <RouteCard key={route.id} route={route} />)
        ) : (
          <div className="text-center py-12 text-[#4B5563]">
            No routes match. Try a different search!
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-5 text-xs font-bold text-[#4B5563]">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#16A34A]" /> Easy</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#EA580C]" /> Medium</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#DC2626]" /> Hard</div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🗺️</div>
        <div>
          <div className="text-[26px] font-extrabold tracking-tight">Explore the map</div>
          <div className="text-[#4B5563] text-[15px] -mt-0.5">Tap a pin to open a route instantly</div>
        </div>
      </div>

      <DynamicMap 
        routes={routes} 
        userLocation={userLocation} 
        onRouteSelect={openRoute} 
      />

      <div className="mt-5 rounded-3xl bg-white border border-[#E5E7EB] p-5 text-[15px]">
        <div className="font-extrabold mb-1 flex items-center gap-2">
          <Compass size={18} /> Pro tip for kids
        </div>
        <div className="text-[#4B5563]">
          Zoom and drag the map. Tap any marker → tap the big green button to jump straight into a route.
        </div>
      </div>

      {userLocation && (
        <button onClick={handleFindNearMe} className="mt-3 text-sm font-bold text-[#16A34A] underline">
          Recenter on my location
        </button>
      )}
    </div>
  );

  const renderLogbook = () => (
    <div className="px-4 pt-5 pb-28">
      <div className="flex items-baseline gap-3 mb-5">
        <div className="text-3xl">📖</div>
        <div>
          <div className="text-[27px] font-extrabold tracking-[-0.8px]">My Logbook</div>
          <div className="text-[#16A34A] font-extrabold text-xl -mt-1">{totalSends} sends</div>
        </div>
      </div>

      {mySends.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border">
          <div className="text-6xl mb-4">🧗</div>
          <div className="font-extrabold text-xl">Your first send is waiting!</div>
          <button onClick={() => setCurrentTab('discover')} className="mt-4 text-[#16A34A] font-bold">Go send something →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {mySends.map((send) => {
            const route = routes.find(r => r.id === send.routeId);
            const gradeClass = route ? getGradeClass(route.grade) : 'green';
            
            return (
              <div key={send.id} className="tick-card flex gap-4 active:bg-[#F8F9F7]" onClick={() => route && openRoute(route)}>
                <div className={`grade-pill ${gradeClass} self-start mt-0.5 !py-1.5 !px-4 text-base`}>{send.grade}</div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="font-extrabold text-[19px] tracking-tight leading-none mb-px">{send.name}</div>
                  <div className="text-[#4B5563] font-semibold text-[15px]">{send.crag}</div>
                  <div className="text-[#9CA3AF] text-sm mt-1.5 font-medium flex items-center gap-1">
                    <Calendar size={14} /> {formatDate(send.date)}
                  </div>
                </div>
                
                <div className="text-right self-center">
                  <div className="text-[#16A34A] text-xs font-extrabold tracking-[0.5px]">SENT</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 text-center text-[#4B5563] text-sm font-medium">
        Every send makes you stronger. Keep going! 💪
      </div>
    </div>
  );

  const renderProfile = () => {
    const pyramidData = [
      { label: "5.12+", count: mySends.filter(s => s.grade.includes('5.12') || s.grade.includes('5.13') || s.grade.includes('5.14')).length, level: 'hard' },
      { label: "5.10–5.11", count: mySends.filter(s => s.grade.match(/5\.(10|11)/)).length, level: 'mid' },
      { label: "5.6–5.9", count: mySends.filter(s => {
          const m = s.grade.match(/5\.(\d+)/); return m && parseInt(m[1]) <= 9;
        }).length, level: 'easy' },
      { label: "V4–V7", count: mySends.filter(s => {
          const m = s.grade.match(/V(\d+)/); return m && parseInt(m[1]) >= 4 && parseInt(m[1]) <= 7;
        }).length, level: 'mid' },
      { label: "V0–V3", count: mySends.filter(s => {
          const m = s.grade.match(/V(\d+)/); return m && parseInt(m[1]) <= 3;
        }).length, level: 'easy' },
    ];

    const savedRoutes = routes.filter(r => savedRouteIds.has(r.id));

    return (
      <div className="px-4 pt-5 pb-28">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center text-white text-4xl shadow-inner">🧗</div>
          <div>
            <div className="font-extrabold text-3xl tracking-tight">Alex Climber</div>
            <div className="text-[#16A34A] font-bold">Crushing since 2024 • 11 crags</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-7">
          <div className="bg-white rounded-3xl p-4 border text-center">
            <div className="font-extrabold text-4xl text-[#16A34A] tabular-nums">{totalSends}</div>
            <div className="font-bold text-sm mt-0.5 tracking-wide">SENDS</div>
          </div>
          <div className="bg-white rounded-3xl p-4 border text-center">
            <div className="font-extrabold text-4xl text-[#EA580C] tabular-nums">{uniqueCrags}</div>
            <div className="font-bold text-sm mt-0.5 tracking-wide">CRAGS</div>
          </div>
          <div className="bg-white rounded-3xl p-4 border text-center">
            <div className="font-extrabold text-4xl text-[#DC2626]">{maxGrade}</div>
            <div className="font-bold text-sm mt-0.5 tracking-wide">HARDEST</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="font-extrabold text-xl mb-3 flex items-center gap-2">
            <Award size={21} /> Your Send Pyramid
          </div>
          <div className="premium-shadow bg-white rounded-3xl p-6 border">
            {pyramidData.map((row, i) => (
              <div key={i} className="pyramid-row mb-2.5 last:mb-0">
                <div className="pyramid-label">{row.label}</div>
                <div className="flex-1">
                  <div 
                    className={`pyramid-bar ${row.level}`} 
                    style={{ width: `${Math.max(18, Math.min(96, row.count * 19 + 22))}%` }}
                  >
                    {row.count > 0 && <span>{row.count}</span>}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center text-xs font-bold text-[#4B5563] mt-3 tracking-wider">KEEP BUILDING IT HIGHER!</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="font-extrabold text-xl mb-3">❤️ Saved for Later ({savedRoutes.length})</div>
          {savedRoutes.length > 0 ? (
            <div className="space-y-2.5">
              {savedRoutes.map(r => (
                <div key={r.id} onClick={() => openRoute(r)} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5 active:bg-zinc-50 cursor-pointer">
                  <div>
                    <div className="font-extrabold">{r.name}</div>
                    <div className="text-sm text-[#4B5563]">{r.crag} • {r.grade}</div>
                  </div>
                  <div className={`grade-pill ${getGradeClass(r.grade)} !text-xs !py-px !px-3.5 self-center`}>{r.grade}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#4B5563] bg-white rounded-2xl p-5 border text-center text-sm">Tap the heart on any route card to save it here.</div>
          )}
        </div>

        <div>
          <div className="font-extrabold text-xl mb-3">Recent Ticks</div>
          <div className="space-y-2">
            {mySends.slice(0, 3).map(send => (
              <div key={send.id} className="tick-card flex justify-between items-center" onClick={() => {
                const r = routes.find(x => x.id === send.routeId);
                if (r) openRoute(r);
              }}>
                <div>
                  <span className="font-extrabold">{send.name}</span>
                  <span className="ml-2 text-sm text-[#4B5563]">{send.grade}</span>
                </div>
                <div className="text-xs font-bold text-[#16A34A]">{formatDate(send.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRouteModal = () => {
    if (!selectedRoute) return null;

    const route = selectedRoute;
    const gradeClass = getGradeClass(route.grade);
    const alreadySent = isRouteSent(route.id);

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={closeModal}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[440px] bg-white rounded-t-3xl overflow-hidden modal-sheet shadow-2xl"
            style={{ maxHeight: '94dvh' }}
          >
            <div className="modal-hero relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={carouselIndex}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className="carousel-img"
                  style={{ backgroundImage: `url(${route.photos[carouselIndex]})` }}
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />

              <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
                <button onClick={closeModal} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:scale-95">
                  <X size={21} />
                </button>
                <button onClick={(e) => toggleSave(route.id, e)} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center active:scale-95">
                  <Heart size={19} className={isSaved(route.id) ? "fill-[#EA580C] text-[#EA580C]" : ""} />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                <div className={`grade-pill ${gradeClass} shadow-xl`}>{route.grade}</div>
                <div className="bg-white/95 text-[#111827] font-extrabold px-4 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow">
                  {getTypeEmoji(route.type)} {route.type}
                </div>
              </div>

              {route.photos.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center active:bg-white">
                    <ChevronLeft size={21} />
                  </button>
                  <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center active:bg-white">
                    <ChevronRight size={21} />
                  </button>
                </>
              )}

              <ConfettiBurst active={showConfetti} />
            </div>

            <div className="p-5 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(94dvh - 260px)' }}>
              <div>
                <div className="font-extrabold text-[27px] tracking-[-1.1px] leading-none mb-1">{route.name}</div>
                <div className="text-[#4B5563] font-semibold text-lg">{route.crag} • {route.area}</div>
              </div>

              <div className="my-5">
                {alreadySent || hasJustSent ? (
                  <div className="h-[62px] rounded-3xl bg-[#DCFCE7] flex items-center justify-center text-[#166534] font-extrabold text-xl gap-2">
                    🔥 YOU ALREADY SENT THIS! 
                  </div>
                ) : (
                  <button 
                    onClick={() => handleSendIt(route)}
                    className="send-it-btn w-full"
                  >
                    <Send size={23} /> SEND IT!!
                  </button>
                )}
                <div className="text-center text-xs font-bold tracking-[0.6px] text-[#4B5563] mt-2">ONE TAP = INSTANT LOG + CONFETTI</div>
              </div>

              {!alreadySent && (
                <button 
                  onClick={() => toggleSave(route.id)}
                  className="w-full mb-5 flex justify-center items-center gap-2 py-3 text-[#EA580C] font-extrabold active:bg-orange-50 rounded-2xl text-[15px]"
                >
                  <Heart size={18} className={isSaved(route.id) ? "fill-current" : ""} />
                  {isSaved(route.id) ? "SAVED — TAP TO REMOVE" : "SAVE FOR LATER"}
                </button>
              )}

              <div className="mb-6">
                <div className="uppercase tracking-[1px] text-xs font-extrabold text-[#4B5563] mb-2 pl-1">QUICK FACTS</div>
                <div className="fact-row">
                  <div className="fact-item">
                    {getTypeEmoji(route.type)} {route.type}
                  </div>
                  <div className="fact-item">
                    📏 {route.length} ft
                  </div>
                  {route.bolts > 0 && (
                    <div className="fact-item">
                      🔩 {route.bolts} bolts
                    </div>
                  )}
                  <div className="fact-item">
                    <Star size={16} className="text-[#FBBF24]" fill="#FBBF24" /> {route.rating} • {route.sends} sends
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="uppercase tracking-[1px] text-xs font-extrabold text-[#4B5563] mb-2 pl-1">BETA FROM THE COMMUNITY</div>
                <div className="beta-card p-5 text-[15.5px] leading-snug font-medium">
                  {route.beta}
                </div>
              </div>

              <div className="mb-6">
                <div className="uppercase tracking-[1px] text-xs font-extrabold text-[#4B5563] mb-2 pl-1">RECENT CONDITIONS</div>
                <div className="space-y-2.5">
                  {route.conditions.map((c, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-[14.5px]">
                      <span className="text-xl mr-2">{c.emoji}</span> 
                      <span className="font-semibold">{c.report}</span>
                      <span className="text-[#4B5563] ml-1.5">— {c.user}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="uppercase tracking-[1px] text-xs font-extrabold text-[#4B5563] mb-2 pl-1">COMMUNITY PHOTOS</div>
                <div className="community-scroll">
                  {[...route.photos, ...route.photos].slice(0, 6).map((photo, idx) => (
                    <div 
                      key={idx} 
                      className="community-photo" 
                      style={{ backgroundImage: `url(${photo})` }}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-center text-[#9CA3AF] font-medium mt-1">Swipe for more →</div>
              </div>
            </div>

            <div className="border-t p-4 bg-white sticky bottom-0">
              <button onClick={closeModal} className="w-full py-3.5 text-sm font-extrabold tracking-widest text-[#4B5563] active:bg-zinc-100 rounded-2xl">
                CLOSE PREVIEW
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  return (
    <div className="app-container flex flex-col bg-[#F8F9F7]">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-extrabold text-2xl tracking-[-1.5px] text-[#111827]">CragTrails</div>
          <div className="text-[10px] px-2 py-px rounded bg-[#F1F5F9] font-extrabold text-[#16A34A] tracking-widest mt-0.5">BETA</div>
        </div>
        <div onClick={() => setCurrentTab('me')} className="flex items-center gap-1.5 cursor-pointer active:opacity-70">
          <div className="w-7 h-7 bg-[#16A34A] rounded-full text-white flex items-center justify-center text-sm">A</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentTab === 'discover' && renderDiscover()}
        {currentTab === 'map' && renderMap()}
        {currentTab === 'logbook' && renderLogbook()}
        {currentTab === 'me' && renderProfile()}
      </div>

      <div className="bottom-nav flex border-t border-[#E5E7EB] z-[70]">
        {[
          { id: 'discover' as const, label: 'Discover', emoji: '🧗' },
          { id: 'map' as const, label: 'Map', emoji: '🗺️' },
          { id: 'logbook' as const, label: 'Logbook', emoji: '📖' },
          { id: 'me' as const, label: 'Me', emoji: '👤' },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.emoji}</span>
              <span className="font-extrabold tracking-[0.2px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {renderRouteModal()}
    </div>
  );
}
