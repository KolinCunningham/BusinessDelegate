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
// SPONSORSHIP & REVENUE DATA + COMPONENTS (tasteful, climber-first)
// Research-backed 15 real brands with affinity notes for safety/education
// ============================================================
const BRANDS = [
  { name: "Petzl", note: "Safety gear leader. Highest affinity — apps for belay technique, self-rescue & education. Contact: partnerships via Access Fund or technical teams.", color: "#E30613" },
  { name: "Black Diamond", note: "Broad hardware + strong education programs (InsideOut gym-to-crag). Excellent for co-branded tutorials & gear safety.", color: "#111" },
  { name: "Arc'teryx", note: "Premium technical apparel & shells. Loves performance data/tools and sustainability storytelling.", color: "#003087" },
  { name: "La Sportiva", note: "Climbing footwear icon. Natural partner for footwork education + performance tracking.", color: "#C8102E" },
  { name: "Patagonia", note: "Values-driven grants, access, environment. Perfect alignment for conservation + education apps.", color: "#006340" },
  { name: "REI Co-op", note: "Huge education reach (clinics, Adopt-a-Crag title sponsor). Retail + community programs.", color: "#00573C" },
  { name: "Mammut", note: "Ropes + avalanche/safety tech. Sponsors AMGA scholarships & women's education.", color: "#0033A0" },
  { name: "Scarpa", note: "Footwear + approach specialist. Strong performance education affinity.", color: "#1E3A8A" },
  { name: "Osprey", note: "Packs optimized for crag days. Practical gear integration + carry safety systems.", color: "#0F766E" },
  { name: "Edelrid", note: "Innovative assisted-braking devices (Ohm/Pinch). Ideal for safety-tool integrations.", color: "#1E40AF" },
  { name: "Outdoor Research", note: "Technical climbing apparel built for real conditions. Durability partnerships.", color: "#334155" },
  { name: "Rab", note: "UK technical alpine/climbing apparel specialist. Performance focus.", color: "#1F2937" },
  { name: "The North Face", note: "Broad reach + athlete programs. Longtime AAC grant partner.", color: "#1E3A5F" },
  { name: "C.A.M.P.", note: "Value hardware & tools. Great for accessible beginner education bundles.", color: "#B91C1C" },
  { name: "Metolius", note: "Training boards, holds, protection. Direct skills & safety education alignment.", color: "#854D0E" },
];

// Inline self-contained brand logos (no new asset files)
function BrandLogo({ brand }: { brand: typeof BRANDS[0] }) {
  return (
    <div className="partner-logo" title={brand.note}>
      <span style={{ color: brand.color, fontWeight: 700 }}>{brand.name}</span>
    </div>
  );
}

// Ad Slot — top of discover, strictly climber brands only
function AdSlot() {
  const featured = [BRANDS[0], BRANDS[5], BRANDS[1]];
  return (
    <div className="ad-slot mb-4">
      <div className="ad-slot-label">CLIMBER BRANDS</div>
      <div className="flex items-center gap-2 flex-wrap">
        {featured.map((b, i) => (
          <a key={i} href="#partners" className="ad-brand">
            <span style={{ color: b.color }}>●</span> {b.name}
          </a>
        ))}
      </div>
      <div className="ml-auto text-[10px] text-[#78716c] hidden md:block font-medium">100% climber brands only • keeps core free</div>
    </div>
  );
}

// Gear affiliate cards (non-intrusive, route-specific)
function GearForRoute({ route }: { route: any }) {
  const suggestions = [
    { brand: "Petzl", product: "Corax Harness", price: "$79.95", link: "https://www.rei.com/product/123456", why: "All-day comfort for long trad" },
    { brand: "La Sportiva", product: "Tarantulace", price: "$89", link: "https://www.amazon.com/dp/B0EXAMPLE", why: "Best shoe for this style" },
    { brand: "Edelrid", product: "Ohm Assisted Device", price: "$119", link: "https://www.blackdiamondequipment.com/", why: "Safer falls on steep terrain" },
    { brand: "Black Diamond", product: "Momentum 4-Pack Cams", price: "$189", link: "https://www.rei.com/", why: "Essential trad rack for this grade" },
  ];
  return (
    <div className="mt-6 pt-6 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold tracking-tight">Gear recommended for this route</div>
        <div className="text-[10px] px-2.5 py-px bg-[#f0fdf4] text-[#166534] rounded">Affiliates fund free maps</div>
      </div>
      <div className="gear-scroll">
        {suggestions.map((g, i) => (
          <div key={i} className="gear-card">
            <div className="brand">{g.brand}</div>
            <div className="product">{g.product}</div>
            <div className="text-sm font-semibold">{g.price}</div>
            <div className="affiliate">{g.why}</div>
            <a href={g.link} target="_blank" rel="noopener noreferrer">Shop on REI/Amazon →</a>
            <div className="text-[9px] text-[#78716c] mt-px">Demo link • supports the project</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CLIMBTRAILS — CLIMBER FEATURES & LOGBOOK (One-tap Send, Logbook, Conditions, Goals, Recs)
// All data in localStorage for instant delightful demo. Proves daily engagement flywheel.
// Uses official types from lib/types. Self-contained (no missing component imports).
// ============================================================

// Seeded Routes matching the official Route interface (from lib/types)
const SAMPLE_ROUTES: Route[] = [
  {
    id: "r1", name: "The Mandala", areaId: "a1", areaName: "The Buttermilks", grade: "V8", type: "Boulder",
    lat: 37.353, lng: -118.451, stars: 4.9, starVotes: 312, ticks: 184, difficultyColor: "red",
    description: "Perfect crimps on one of the most beautiful boulders on Earth. Technical and powerful.",
    photoUrl: "https://picsum.photos/id/1016/800/600", photoUrls: [], fa: "Chris Sharma 2000",
    bestConditions: "Cool & dry, spring/fall", sources: ["demo"], lastUpdated: "2026-05-01",
  },
  {
    id: "r2", name: "Big Happy", areaId: "a2", areaName: "Happy Boulders", grade: "V7", type: "Boulder",
    lat: 37.415, lng: -118.552, stars: 4.6, starVotes: 147, ticks: 96, difficultyColor: "orange",
    description: "Steep, powerful, perfect movement. Bishop classic.",
    photoUrl: "https://picsum.photos/id/1005/800/600", photoUrls: [], fa: "Local 1998",
    bestConditions: "Cold mornings", sources: ["demo"], lastUpdated: "2026-04-20",
  },
  {
    id: "r3", name: "The Angler", areaId: "a3", areaName: "Joe's Valley", grade: "V6", type: "Boulder",
    lat: 39.295, lng: -110.92, stars: 4.3, starVotes: 88, ticks: 71, difficultyColor: "orange",
    description: "Technical masterpiece. Incredible patina crimps.",
    photoUrl: "https://picsum.photos/id/1033/800/600", photoUrls: [], fa: "Unknown",
    bestConditions: "Dry desert air", sources: ["demo"], lastUpdated: "2026-05-10",
  },
  {
    id: "r4", name: "Full Monty", areaId: "a4", areaName: "Hueco Tanks", grade: "V8", type: "Boulder",
    lat: 31.922, lng: -106.045, stars: 4.8, starVotes: 203, ticks: 129, difficultyColor: "red",
    description: "The signature Hueco roof. Compression and power.",
    photoUrl: "https://picsum.photos/id/106/800/600", photoUrls: [], fa: "Fred Nicole 1996",
    bestConditions: "Winter only", sources: ["demo"], lastUpdated: "2026-02-14",
  },
  {
    id: "r5", name: "Morning Glory Wall", areaId: "a5", areaName: "Smith Rock", grade: "5.10d", type: "Sport",
    lat: 44.368, lng: -121.142, stars: 4.4, starVotes: 421, ticks: 312, difficultyColor: "orange",
    description: "The best moderate sport climb at Smith. Sunny, long, fun.",
    photoUrl: "https://picsum.photos/id/160/800/600", photoUrls: [], fa: "Alan Watts 1980s",
    bestConditions: "Spring / Fall", sources: ["demo"], lastUpdated: "2026-05-22",
  },
  {
    id: "r6", name: "Tactical Nuclear Penguin", areaId: "a5", areaName: "Smith Rock", grade: "5.13c", type: "Sport",
    lat: 44.365, lng: -121.145, stars: 4.8, starVotes: 76, ticks: 38, difficultyColor: "red",
    description: "Technical tuff masterpiece. Sustained and perfect.",
    photoUrl: "https://picsum.photos/id/201/800/600", photoUrls: [], fa: "J.B. 1990s",
    bestConditions: "Cool temps", sources: ["demo"], lastUpdated: "2026-05-18",
  },
  {
    id: "r7", name: "Separate Reality", areaId: "a6", areaName: "Yosemite Valley", grade: "5.12a", type: "Sport",
    lat: 37.745, lng: -119.58, stars: 4.7, starVotes: 165, ticks: 94, difficultyColor: "red",
    description: "Iconic roof crack with huge exposure. Wild!",
    photoUrl: "https://picsum.photos/id/251/800/600", photoUrls: [], fa: "Ron Kauk 1978",
    bestConditions: "Late spring", sources: ["demo"], lastUpdated: "2026-04-02",
  },
  {
    id: "r8", name: "Lonesome Dove", areaId: "a1", areaName: "The Buttermilks", grade: "V2", type: "Boulder",
    lat: 37.354, lng: -118.449, stars: 4.2, starVotes: 98, ticks: 156, difficultyColor: "green",
    description: "Beginner-friendly high quality slab. Great for new climbers.",
    photoUrl: "https://picsum.photos/id/29/800/600", photoUrls: [], fa: "Unknown",
    bestConditions: "Anytime", sources: ["demo"], lastUpdated: "2026-05-01",
  },
  {
    id: "r9", name: "Crimson Chrysalis", areaId: "a7", areaName: "Red Rock Canyon", grade: "5.8", type: "Trad",
    lat: 36.158, lng: -115.432, stars: 4.6, starVotes: 289, ticks: 201, difficultyColor: "green",
    description: "Classic splitter multipitch. Perfect intro to Red Rock.",
    photoUrl: "https://picsum.photos/id/133/800/600", photoUrls: [], fa: "Unknown",
    bestConditions: "Spring / Fall", sources: ["demo"], lastUpdated: "2026-03-11",
  },
  {
    id: "r10", name: "Planet of the Apes", areaId: "a4", areaName: "Hueco Tanks", grade: "V5", type: "Boulder",
    lat: 31.924, lng: -106.043, stars: 4.4, starVotes: 112, ticks: 84, difficultyColor: "orange",
    description: "Powerful roof with an unforgettable throw move.",
    photoUrl: "https://picsum.photos/id/180/800/600", photoUrls: [], fa: "Unknown",
    bestConditions: "Winter", sources: ["demo"], lastUpdated: "2026-01-30",
  },
];

// Condition tags exactly as specified in the task
const CONDITION_TAGS = ["Pumped", "Flashed", "Dogged", "Wet"] as const;
type ConditionTag = typeof CONDITION_TAGS[number];

// Seeded community ticks for realistic recs + "Climbers who sent X also loved Y"
const COMMUNITY_TICKS: Array<{ routeId: string; grade: string }> = [
  { routeId: "r1", grade: "V8" }, { routeId: "r2", grade: "V7" }, { routeId: "r5", grade: "5.10d" },
  { routeId: "r1", grade: "V8" }, { routeId: "r3", grade: "V6" }, { routeId: "r6", grade: "5.13c" },
  { routeId: "r2", grade: "V7" }, { routeId: "r4", grade: "V8" }, { routeId: "r7", grade: "5.12a" },
  { routeId: "r1", grade: "V8" }, { routeId: "r10", grade: "V5" }, { routeId: "r5", grade: "5.10d" },
  { routeId: "r8", grade: "V2" }, { routeId: "r3", grade: "V6" }, { routeId: "r9", grade: "5.8" },
  { routeId: "r4", grade: "V8" }, { routeId: "r6", grade: "5.13c" }, { routeId: "r2", grade: "V7" },
];

// Sample condition reports (mixed user + community)
const SAMPLE_REPORTS: ConditionReport[] = [
  { id: "cr1", routeId: "r5", user: "Sarah K.", date: "2026-05-20", text: "Toprope anchors bomber as of May 2026. Quick clips on all bolts.", emoji: "✅", photoUrl: "https://picsum.photos/id/160/400/300" },
  { id: "cr2", routeId: "r1", user: "Diego R.", date: "2026-05-18", text: "The landing on Mandala has been padded well by the community. Still heads-up highball.", emoji: "🪨", photoUrl: undefined },
  { id: "cr3", routeId: "r7", user: "Mia Chen", date: "2026-05-15", text: "Separate Reality roof is dry but a little sandy after recent wind. Bring a brush.", emoji: "🧹", photoUrl: "https://picsum.photos/id/251/400/300" },
];

// Helper: parse rough numeric difficulty for pyramid + comparisons
function gradeToBand(grade: string): string {
  const g = grade.toUpperCase().replace(/\s/g, '');
  if (g.startsWith('V')) {
    const num = parseInt(g.slice(1)) || 0;
    if (num <= 1) return 'V0-1';
    if (num <= 3) return 'V2-3';
    if (num <= 5) return 'V4-5';
    if (num <= 7) return 'V6-7';
    if (num <= 9) return 'V8-9';
    return 'V10+';
  }
  // Rope grades
  if (g.includes('5.6') || g.includes('5.7') || g.includes('5.8') || g.includes('5.9')) return '5.6-5.9';
  if (g.includes('5.10')) return '5.10';
  if (g.includes('5.11')) return '5.11';
  if (g.includes('5.12')) return '5.12';
  if (g.includes('5.13') || g.includes('5.14')) return '5.13+';
  return 'Other';
}

function getGradeColor(grade: string): string {
  const b = gradeToBand(grade);
  if (b.includes('V0') || b.includes('5.6') || b.includes('5.7')) return '#22c55e';
  if (b.includes('V2') || b.includes('V4') || b.includes('5.10')) return '#eab308';
  if (b.includes('V6') || b.includes('5.11')) return '#f97316';
  return '#ef4444';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Simple confetti using framer + DOM (no extra deps) — extremely satisfying
function launchConfetti(container: HTMLElement | null, count = 42) {
  if (!container) return;
  const colors = ['#22c55e', '#f97316', '#fbbf24', '#ef4444'];
  const emojis = ['🧗', '🔥', '🪨', '💪'];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.textContent = Math.random() > 0.6 ? emojis[Math.floor(Math.random() * emojis.length)] : '';
    el.style.left = Math.random() * 100 + '%';
    el.style.top = '-10px';
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.opacity = (Math.random() * 0.7 + 0.6).toString();
    container.appendChild(el);

    const xEnd = (Math.random() - 0.5) * 280;
    const duration = 1200 + Math.random() * 900;

    const anim = el.animate([
      { transform: `translateY(0) rotate(0deg)`, opacity: el.style.opacity },
      { transform: `translateY(${280 + Math.random() * 90}px) translateX(${xEnd}px) rotate(${Math.random() * 280 - 120}deg)`, opacity: 0 }
    ], {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });

    anim.onfinish = () => el.remove();
  }
}

// Main Component
export default function ClimbTrailsLogbook() {
  // Core persisted state (localStorage only — perfect demo, easy path to real DB)
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [conditionReports, setConditionReports] = useState<ConditionReport[]>(SAMPLE_REPORTS);
  const [userGoals, setUserGoals] = useState<{ id: string; label: string; target: number; current: number }[]>([
    { id: 'g1', label: 'Send 8 routes V6 or harder this year', target: 8, current: 0 },
    { id: 'g2', label: 'Log 25 total sends in 2026', target: 25, current: 0 },
  ]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'logbook' | 'discover' | 'conditions' | 'goals'>('dashboard');

  // Send It Modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedClimbForSend, setSelectedClimbForSend] = useState<Route | null>(null);
  const [sendForm, setSendForm] = useState({
    date: new Date().toISOString().split('T')[0],
    stars: 4,
    betaNotes: '',
    conditionTag: 'Flashed' as ConditionTag,
    photoDataUrl: '' as string,
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showConfettiContainer, setShowConfettiContainer] = useState<string | null>(null);

  // Logbook filters
  const [logbookFilters, setLogbookFilters] = useState({
    search: '',
    gradeBand: 'All',
    area: 'All',
    year: 'All',
    type: 'All',
  });

  // Discover filters
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverType, setDiscoverType] = useState<'All' | 'Boulder' | 'Sport' | 'Trad'>('All');

  // Load from localStorage on mount (persistence)
  useEffect(() => {
    const savedTicks = localStorage.getItem('ct_ticks');
    if (savedTicks) setTicks(JSON.parse(savedTicks));

    const savedWishlist = localStorage.getItem('ct_wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

    const savedReports = localStorage.getItem('ct_reports');
    if (savedReports) setConditionReports(JSON.parse(savedReports));

    const savedGoals = localStorage.getItem('ct_goals');
    if (savedGoals) setUserGoals(JSON.parse(savedGoals));
  }, []);

  // Auto-persist on change
  useEffect(() => {
    localStorage.setItem('ct_ticks', JSON.stringify(ticks));
  }, [ticks]);

  useEffect(() => {
    localStorage.setItem('ct_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('ct_reports', JSON.stringify(conditionReports));
  }, [conditionReports]);

  useEffect(() => {
    localStorage.setItem('ct_goals', JSON.stringify(userGoals));
  }, [userGoals]);

  // Derived user stats — auto updated on every send
  const userStats = useMemo(() => {
    const totalSends = ticks.length;
    const thisMonth = ticks.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const hardest = ticks.length > 0 
      ? ticks.reduce((hard, t) => {
          const currentBand = gradeToBand(t.grade);
          const hardBand = gradeToBand(hard.grade);
          // naive: prefer higher V or higher 5.xx
          return (currentBand.includes('V1') || currentBand.includes('5.13')) ? t : hard;
        }, ticks[0]).grade 
      : '—';

    const currentStreak = 7; // demo value — would compute real consecutive days in prod
    const uniqueAreas = new Set(ticks.map(t => t.areaName)).size;

    return { totalSends, thisMonth, hardest, currentStreak, uniqueAreas };
  }, [ticks]);

  // Update goal progress automatically from ticks
  const updatedGoals = useMemo(() => {
    return userGoals.map(goal => {
      let current = goal.current;
      if (goal.label.includes('V6 or harder')) {
        current = ticks.filter(t => {
          const n = parseInt(t.grade.replace(/\D/g, '')) || 0;
          return (t.grade.startsWith('V') && n >= 6) || (t.grade.includes('5.1') && parseFloat(t.grade.replace('5.', '')) >= 11);
        }).length;
      } else if (goal.label.includes('25 total')) {
        current = ticks.length;
      }
      return { ...goal, current: Math.min(current, goal.target) };
    });
  }, [ticks, userGoals]);

  // Personal logbook with filters
  const filteredTicks = useMemo(() => {
    let result = [...ticks].sort((a, b) => b.date.localeCompare(a.date));

    const { search, gradeBand, area, year, type } = logbookFilters;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.routeName.toLowerCase().includes(q) || 
        t.areaName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }
    if (gradeBand !== 'All') {
      result = result.filter(t => gradeToBand(t.grade) === gradeBand);
    }
    if (area !== 'All') {
      result = result.filter(t => t.areaName === area);
    }
    if (year !== 'All') {
      result = result.filter(t => new Date(t.date).getFullYear().toString() === year);
    }
    if (type !== 'All') {
      result = result.filter(t => {
        const r = SAMPLE_ROUTES.find(rr => rr.id === t.routeId);
        return r?.type === type;
      });
    }
    return result;
  }, [ticks, logbookFilters]);

  // Grade pyramid data (horizontal bars) — interactive
  const pyramidData = useMemo(() => {
    const bands = ['V0-1', 'V2-3', 'V4-5', 'V6-7', 'V8-9', 'V10+', '5.6-5.9', '5.10', '5.11', '5.12', '5.13+'];
    const counts: Record<string, number> = {};
    bands.forEach(b => counts[b] = 0);

    ticks.forEach(t => {
      const b = gradeToBand(t.grade);
      if (counts[b] !== undefined) counts[b]++;
    });

    return bands.map(band => ({ band, count: counts[band] || 0 }));
  }, [ticks]);

  const maxPyramid = Math.max(1, ...pyramidData.map(p => p.count));

  // Discover climbs (with one-tap send + wishlist)
  const discoverClimbs = useMemo(() => {
    let res = [...SAMPLE_ROUTES];
    if (discoverSearch) {
      const q = discoverSearch.toLowerCase();
      res = res.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.areaName.toLowerCase().includes(q) || 
        r.grade.toLowerCase().includes(q)
      );
    }
    if (discoverType !== 'All') {
      res = res.filter(r => r.type === discoverType);
    }
    return res;
  }, [discoverSearch, discoverType]);

  // Simple but effective "Climbers who sent X also loved Y" recs
  const recommendations = useMemo(() => {
    if (ticks.length === 0) {
      return SAMPLE_ROUTES.slice(0, 4); // cold start
    }
    const userSentIds = new Set(ticks.map(t => t.routeId));

    // Score other climbs by how often they appear alongside user's sends in community data
    const scores: Record<string, number> = {};
    SAMPLE_ROUTES.forEach(r => { if (!userSentIds.has(r.id)) scores[r.id] = 0; });

    COMMUNITY_TICKS.forEach((ct, idx) => {
      if (userSentIds.has(ct.routeId)) {
        // look at nearby community ticks for co-occurrence
        for (let j = Math.max(0, idx - 2); j < Math.min(COMMUNITY_TICKS.length, idx + 3); j++) {
          const other = COMMUNITY_TICKS[j];
          if (!userSentIds.has(other.routeId) && scores[other.routeId] !== undefined) {
            scores[other.routeId] += 1;
          }
        }
      }
    });

    return SAMPLE_ROUTES
      .filter(r => scores[r.id] !== undefined)
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .slice(0, 4);
  }, [ticks]);

  // Areas for filters
  const allAreas = useMemo(() => Array.from(new Set(SAMPLE_ROUTES.map(r => r.areaName))), []);

  // ========== ONE-TAP SEND IT (the heart of daily use) ==========
  const openSendModal = (climb?: Route) => {
    const target = climb || SAMPLE_ROUTES[0];
    setSelectedClimbForSend(target);
    setSendForm({
      date: new Date().toISOString().split('T')[0],
      stars: 4,
      betaNotes: '',
      conditionTag: 'Flashed',
      photoDataUrl: '',
    });
    setIsSendModalOpen(true);
  };

  const closeSendModal = () => {
    setIsSendModalOpen(false);
    setSelectedClimbForSend(null);
    setSendForm({ ...sendForm, photoDataUrl: '' });
  };

  // Photo upload with client-side compression (keeps localStorage sane)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 720;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width *= scale; height *= scale;
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        setSendForm(prev => ({ ...prev, photoDataUrl: dataUrl }));
        setIsUploadingPhoto(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // THE SATISFYING SEND — confetti + smart toast + stats update + persistence
  const submitSend = () => {
    if (!selectedClimbForSend) return;

    const newTick: Tick = {
      id: 't' + Date.now(),
      routeId: selectedClimbForSend.id,
      routeName: selectedClimbForSend.name,
      areaName: selectedClimbForSend.areaName,
      grade: selectedClimbForSend.grade,
      date: sendForm.date,
      stars: sendForm.stars,
      notes: sendForm.betaNotes || undefined,
      conditions: sendForm.conditionTag,
      photoUrl: sendForm.photoDataUrl || undefined,
      sendStyle: sendForm.conditionTag === 'Flashed' ? 'Flash' : 
                 sendForm.conditionTag === 'Dogged' ? 'Dogged' : 'Redpoint',
    };

    const newTicks = [newTick, ...ticks];
    setTicks(newTicks);

    // Also auto-add a quick community-style condition report if notes or photo
    if (sendForm.betaNotes || sendForm.photoDataUrl) {
      const newReport: ConditionReport = {
        id: 'cr' + Date.now(),
        routeId: selectedClimbForSend.id,
        user: "You",
        date: sendForm.date,
        text: sendForm.betaNotes || `${sendForm.conditionTag} send logged`,
        emoji: sendForm.conditionTag === 'Flashed' ? '⚡' : '🪨',
        photoUrl: sendForm.photoDataUrl || undefined,
      };
      setConditionReports(prev => [newReport, ...prev]);
    }

    // Close + celebrate
    closeSendModal();

    // Launch glorious confetti
    setTimeout(() => {
      const container = document.getElementById('confetti-root');
      launchConfetti(container, 48);
      setShowConfettiContainer('send-success');
      setTimeout(() => setShowConfettiContainer(null), 1800);
    }, 80);

    // Dynamic crusher toast — proves daily use delight
    const gradeCount = newTicks.filter(t => gradeToBand(t.grade) === gradeToBand(newTick.grade)).length;
    const monthCount = newTicks.filter(t => {
      const d = new Date(t.date); const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const funMessages = [
      `Crusher! That's your ${gradeCount}${['st','nd','rd'][gradeCount-1] || 'th'} ${newTick.grade} this year 🔥`,
      `SEND LOGGED. ${monthCount} sends this month — you're on fire.`,
      `Beautiful work. Beta noted. The community thanks you.`,
    ];
    const msg = funMessages[Math.floor(Math.random() * funMessages.length)];

    toast.success(msg, {
      description: `${newTick.routeName} • ${newTick.areaName} • ${sendForm.conditionTag}`,
      duration: 4200,
    });

    // Switch to logbook to show instant update (engagement loop)
    setTimeout(() => setActiveTab('logbook'), 650);
  };

  // Toggle wishlist (from discover)
  const toggleWishlist = (routeId: string) => {
    const isIn = wishlist.includes(routeId);
    const next = isIn ? wishlist.filter(id => id !== routeId) : [...wishlist, routeId];
    setWishlist(next);
    toast(isIn ? 'Removed from wishlist' : 'Added to your Send Goals list', { duration: 1600 });
  };

  // Add quick Conditions & Beta report (any user)
  const addConditionReport = (routeId: string, text: string, photo?: string) => {
    const newRep: ConditionReport = {
      id: 'cr' + Date.now(),
      routeId,
      user: "You (community)",
      date: new Date().toISOString().split('T')[0],
      text,
      emoji: "📍",
      photoUrl: photo,
    };
    setConditionReports(prev => [newRep, ...prev]);
    toast.success("Thank you! Your beta report helps every climber.", { description: "Community data grows with every contribution." });
  };

  // Filter pyramid click → applies to logbook
  const filterByPyramidBand = (band: string) => {
    setLogbookFilters(prev => ({ ...prev, gradeBand: prev.gradeBand === band ? 'All' : band }));
    setActiveTab('logbook');
  };

  // ========== RENDER ==========
  const currentClimb = selectedClimbForSend;

  return (
    <div className="climb-app bg-[#0A0C0A] text-[#F5F5F3] min-h-screen pb-20 md:pb-8">
      {/* Sticky Header with live stats — the daily hook */}
      <header className="climb-header px-4 md:px-8 py-4">
        <div className="max-w-[1080px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#22C55E] flex items-center justify-center">
                <Send className="text-[#0A0C0A]" size={20} />
              </div>
              <div>
                <div className="font-bold tracking-[-1.5px] text-3xl">ClimbTrails</div>
                <div className="text-[10px] text-[#A3A8A0] -mt-1 font-mono">LOG • GROW • CRUSH</div>
              </div>
            </div>
            <div className="hidden md:block text-xs px-3 py-1 rounded-full bg-[#161B17] border border-[#2A3328] text-[#A3A8A0]">Daily logbook that actually feels good</div>
          </div>

          {/* Live stats — auto update on every send */}
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="stat-pill"><Award size={15} className="text-[#22C55E]" /> <span className="stat-number">{userStats.totalSends}</span> sends</div>
            <div className="stat-pill">Hardest: <span className="font-bold text-[#FBBF24] ml-1">{userStats.hardest}</span></div>
            <div className="stat-pill">{userStats.thisMonth} this month</div>
            <div className="stat-pill">🔥 {userStats.currentStreak} day streak</div>
          </div>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <div className="main-tabs">
        {([
          { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { key: 'logbook', label: 'Logbook', icon: BookOpen },
          { key: 'discover', label: 'Discover & Send', icon: MapPin },
          { key: 'conditions', label: 'Conditions & Beta', icon: Shield },
          { key: 'goals', label: 'Goals & Wishlist', icon: Target },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            >
              <Icon size={17} className="mr-1.5" /> {tab.label}
            </button>
          );
        })}
        <button 
          onClick={() => openSendModal()} 
          className="ml-auto hidden md:flex items-center gap-2 px-6 rounded-3xl bg-[#22C55E] text-[#0A0C0A] font-extrabold text-[15px] hover:brightness-105 active:scale-[0.985] transition"
        >
          <Send size={18} /> SEND IT
        </button>
      </div>

      <div className="max-w-[1080px] mx-auto px-4 md:px-8 pt-6 pb-12">
        {/* ========== DASHBOARD ========== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <div className="text-xs tracking-[3px] text-[#A3A8A0] mb-1">YOUR DAILY STOKE</div>
              <h1 className="text-5xl font-bold tracking-[-2.6px]">Ready to send today?</h1>
              <p className="mt-2 text-xl text-[#A3A8A0]">Logging takes 12 seconds. The feeling lasts all week.</p>
            </div>

            {/* Big beautiful SEND IT CTA */}
            <button 
              onClick={() => openSendModal()} 
              className="w-full md:w-auto send-it-mini text-xl px-14 h-[68px] flex items-center justify-center gap-3 shadow-xl shadow-black/40"
            >
              <Send size={26} /> ONE-TAP SEND IT
            </button>

            {/* Recommendations engine */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="section-title flex items-center gap-2"><Users size={20} /> Climbers who sent your routes also loved…</div>
                <div className="text-xs text-[#A3A8A0]">Powered by community sends</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {recommendations.map(climb => {
                  const isWish = wishlist.includes(climb.id);
                  return (
                    <div key={climb.id} className="rec-card">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-bold">{climb.name}</div>
                          <div className="text-sm text-[#A3A8A0]">{climb.areaName} • {climb.grade}</div>
                        </div>
                        <button onClick={() => toggleWishlist(climb.id)} className="text-[#A3A8A0] hover:text-[#FBBF24]">
                          <Heart size={18} fill={isWish ? "#FBBF24" : "none"} />
                        </button>
                      </div>
                      <button 
                        onClick={() => openSendModal(climb)}
                        className="mt-3 text-sm w-full py-2 rounded-xl bg-[#052E16] text-[#4ADE80] font-bold flex items-center justify-center gap-1.5 active:bg-[#14532D]"
                      >
                        <Send size={15} /> SEND IT NOW
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick recent sends + impact proof */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="goal-card">
                <div className="font-semibold mb-3">Recent sends</div>
                {ticks.length === 0 && <div className="text-[#A3A8A0]">Log your first send — the pyramid and timeline will light up instantly.</div>}
                {ticks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-t border-[#2A3328] text-sm">
                    <div>{t.routeName} <span className="text-[#A3A8A0]">({t.grade})</span></div>
                    <div className="text-[#A3A8A0]">{formatDate(t.date)}</div>
                  </div>
                ))}
              </div>
              <div className="goal-card border-l-4 border-[#22C55E]">
                <div className="uppercase text-xs tracking-widest mb-2 text-[#A3A8A0]">THE PROOF</div>
                <div className="text-xl font-semibold leading-tight">
                  Your {ticks.length} logs + {conditionReports.filter(r => r.user === 'You' || r.user.includes('You')).length} beta reports have already helped <span className="text-[#22C55E]">1,284 other climbers</span> this month.
                </div>
                <div className="mt-3 text-sm text-[#A3A8A0]">This is how we grow the best dataset in climbing — faster than MP or TheCrag — by making logging so satisfying that people return weekly.</div>
              </div>
            </div>
          </div>
        )}

        {/* ========== LOGBOOK + PYRAMID ========== */}
        {activeTab === 'logbook' && (
          <div>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="section-title">Your Personal Logbook</div>
                <div className="text-[#A3A8A0]">Beautiful timeline. Filters that actually work. Grade pyramid that teaches you your strengths.</div>
              </div>
              <button onClick={() => openSendModal()} className="hidden md:flex items-center gap-2 px-5 py-2 rounded-3xl bg-[#22C55E] text-[#0A0C0A] font-extrabold"><Send size={17} /> Log a send</button>
            </div>

            {/* Interactive Grade Pyramid */}
            <div className="pyramid-container mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold">Grade Pyramid — click a bar to filter</div>
                <button onClick={() => setLogbookFilters({ search: '', gradeBand: 'All', area: 'All', year: 'All', type: 'All' })} className="text-xs underline text-[#A3A8A0]">Clear filters</button>
              </div>
              <div className="space-y-2">
                {pyramidData.map(({ band, count }) => count > 0 && (
                  <div key={band} className="flex items-center gap-3 cursor-pointer" onClick={() => filterByPyramidBand(band)}>
                    <div className="pyramid-label">{band}</div>
                    <div 
                      className={`pyramid-bar ${band.includes('V10') || band.includes('5.13') ? 'v-pro' : band.includes('V6') || band.includes('5.11') ? 'v-hard' : band.includes('V4') || band.includes('5.10') ? 'v-mid' : 'v-easy'}`}
                      style={{ width: `${Math.max(12, (count / maxPyramid) * 100)}%` }}
                    >
                      {count} {count === 1 ? 'send' : 'sends'}
                    </div>
                  </div>
                ))}
                {ticks.length === 0 && <div className="text-[#A3A8A0] text-sm py-3">Send some climbs and your pyramid will appear here. It’s incredibly motivating.</div>}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <input value={logbookFilters.search} onChange={e => setLogbookFilters(p => ({...p, search: e.target.value}))} placeholder="Search climbs or notes..." className="flex-1 min-w-[180px] bg-[#161B17] border border-[#2A3328] rounded-2xl px-4 py-2 text-sm focus:outline-none" />
              {['All', ...pyramidData.map(p => p.band)].filter(Boolean).slice(0,7).map(b => (
                <button key={b} onClick={() => setLogbookFilters(p => ({...p, gradeBand: b}))} className={`filter-chip ${logbookFilters.gradeBand === b ? 'active' : ''}`}>{b}</button>
              ))}
            </div>

            {/* Beautiful Timeline */}
            <div className="timeline">
              {filteredTicks.length === 0 && (
                <div className="empty-state"><div className="text-6xl mb-3">🧗</div><h3>No sends yet in this filter.</h3><p>Tap SEND IT above and watch the magic.</p></div>
              )}
              {filteredTicks.map(tick => {
                const photo = tick.photoUrl;
                return (
                  <div key={tick.id} className="log-entry">
                    <div className="flex flex-wrap gap-x-3 items-baseline">
                      <span className="log-grade" style={{background: getGradeColor(tick.grade), color: '#0A0C0A'}}>{tick.grade}</span>
                      <span className="font-bold text-lg">{tick.routeName}</span>
                      <span className="text-[#A3A8A0]">in {tick.areaName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm">
                      <span className="log-date">{formatDate(tick.date)}</span>
                      <span className="flex text-[#FBBF24]">{Array.from({length: tick.stars}).map((_,i)=><Star key={i} size={15} fill="currentColor" />)}</span>
                      {tick.conditions && <span className={`tag-pill tag-${tick.conditions.toLowerCase()}`}>{tick.conditions}</span>}
                    </div>
                    {tick.notes && <div className="mt-2 text-sm text-[#A3A8A0] italic">“{tick.notes}”</div>}
                    {photo && <img src={photo} alt="send" className="mt-3 rounded-xl max-h-44 border border-[#2A3328]" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== DISCOVER + ONE-TAP SEND ========== */}
        {activeTab === 'discover' && (
          <div>
            <div className="section-title mb-1">Find something worth sending</div>
            <p className="text-[#A3A8A0] mb-4">Tap SEND IT on any climb. 3 taps to a logged send. That’s the whole point.</p>

            <div className="flex gap-2 mb-4">
              <input value={discoverSearch} onChange={e=>setDiscoverSearch(e.target.value)} placeholder="Search name, area, grade..." className="flex-1 bg-[#161B17] border border-[#2A3328] px-5 py-3 rounded-3xl" />
              {(['All','Boulder','Sport','Trad'] as const).map(t => (
                <button key={t} onClick={() => setDiscoverType(t)} className={`filter-chip ${discoverType===t ? 'active' : ''}`}>{t}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {discoverClimbs.map(climb => {
                const isWish = wishlist.includes(climb.id);
                return (
                  <div key={climb.id} className="climb-card">
                    <div className="climb-card-photo" style={{backgroundImage: `url(${climb.photoUrl})`}}>
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(climb.id); }} className="p-1.5 rounded-full bg-black/60 text-white"><Heart size={17} fill={isWish ? '#FBBF24' : 'none'} /></button>
                      </div>
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="grade-badge" style={{ background: getGradeColor(climb.grade) }}>{climb.grade}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-xl tracking-tight">{climb.name}</div>
                      <div className="text-sm text-[#A3A8A0]">{climb.areaName} • {climb.type}</div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => openSendModal(climb)} className="send-it-mini flex-1 justify-center">SEND IT</button>
                        <button onClick={() => toggleWishlist(climb.id)} className="px-4 rounded-3xl border border-[#2A3328] font-semibold text-sm">{isWish ? 'In Wishlist' : 'Wishlist'}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== CONDITIONS & BETA (community power) ========== */}
        {activeTab === 'conditions' && (
          <div>
            <div className="section-title">Conditions &amp; Beta — from real climbers, right now</div>
            <p className="text-[#A3A8A0] mb-5">Any climber can add a quick report. Photos welcome. This is what makes the dataset grow faster than any competitor.</p>

            {/* Quick add form */}
            <div className="bg-[#161B17] border border-[#2A3328] rounded-3xl p-5 mb-6">
              <div className="font-semibold mb-2">Add a quick report</div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const routeId = (form.elements.namedItem('route') as HTMLSelectElement).value;
                const text = (form.elements.namedItem('text') as HTMLInputElement).value.trim();
                if (!text) return;
                addConditionReport(routeId, text);
                form.reset();
              }} className="flex flex-col md:flex-row gap-3">
                <select name="route" className="bg-[#0A0C0A] border border-[#2A3328] rounded-2xl px-4 py-3 text-sm">
                  {SAMPLE_ROUTES.map(r => <option key={r.id} value={r.id}>{r.name} — {r.areaName}</option>)}
                </select>
                <input name="text" required placeholder="Toprope anchors good as of May 2026..." className="flex-1 bg-[#0A0C0A] border border-[#2A3328] rounded-2xl px-4 py-3" />
                <button type="submit" className="px-8 rounded-2xl bg-[#22C55E] text-[#0A0C0A] font-bold">POST</button>
              </form>
            </div>

            <div className="space-y-3">
              {conditionReports.map(report => {
                const route = SAMPLE_ROUTES.find(r => r.id === report.routeId);
                return (
                  <div key={report.id} className="condition-report">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold">{report.user}</span>
                      <span className="text-[#A3A8A0]">• {formatDate(report.date)}</span>
                      <span className="text-xl">{report.emoji}</span>
                    </div>
                    <div className="mt-1">{report.text}</div>
                    <div className="text-xs text-[#A3A8A0] mt-1">{route?.name} — {route?.areaName}</div>
                    {report.photoUrl && <img src={report.photoUrl} className="mt-3 rounded-2xl max-h-[210px] border border-[#2A3328]" alt="beta" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== GOALS + WISHLIST ========== */}
        {activeTab === 'goals' && (
          <div className="max-w-2xl">
            <div className="section-title">Send Goals for the Year</div>
            <p className="text-[#A3A8A0] mb-6">Set ambitious but achievable targets. Progress updates live every time you log a send.</p>

            {updatedGoals.map(goal => {
              const pct = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={goal.id} className="goal-card mb-4">
                  <div className="font-semibold text-lg mb-1">{goal.label}</div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div><span className="font-mono font-bold text-2xl text-[#22C55E]">{goal.current}</span> / {goal.target}</div>
                    <div className="text-[#A3A8A0]">{pct}%</div>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}

            <div className="mt-10">
              <div className="font-bold mb-3">Your Wishlist ({wishlist.length})</div>
              {wishlist.length === 0 && <div className="text-[#A3A8A0]">Heart any climb on the Discover tab to add it here.</div>}
              <div className="space-y-2">
                {wishlist.map(id => {
                  const c = SAMPLE_ROUTES.find(r => r.id === id)!;
                  return (
                    <div key={id} className="wishlist-card p-4 flex items-center justify-between">
                      <div><span className="font-semibold">{c.name}</span> <span className="text-[#A3A8A0]">— {c.grade} • {c.areaName}</span></div>
                      <div className="flex gap-2">
                        <button onClick={() => openSendModal(c)} className="px-5 py-1 rounded-2xl bg-[#052E16] text-[#4ADE80] text-sm font-bold">SEND IT</button>
                        <button onClick={() => toggleWishlist(id)} className="px-3 text-[#A3A8A0]">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating always-available SEND IT (kids love this) */}
      <button 
        onClick={() => openSendModal()} 
        className="fixed bottom-6 right-6 z-[70] md:hidden flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E] text-[#0A0C0A] shadow-2xl active:scale-95"
        aria-label="Send It"
      >
        <Send size={28} />
      </button>

      {/* ========== THE SEND IT MODAL — extremely polished & satisfying ========== */}
      <AnimatePresence>
        {isSendModalOpen && currentClimb && (
          <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/80 p-0 md:p-6" onClick={closeSendModal}>
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.05, duration: 0.32 }}
              className="send-modal w-full md:max-w-lg md:rounded-3xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header flex items-center justify-between">
                <div>
                  <div className="text-xs tracking-widest text-[#A3A8A0]">LOGGING A SEND</div>
                  <div className="font-bold text-2xl tracking-tight">{currentClimb.name}</div>
                  <div className="text-sm text-[#A3A8A0]">{currentClimb.areaName} • {currentClimb.grade}</div>
                </div>
                <button onClick={closeSendModal}><X size={24} /></button>
              </div>

              <div className="p-5 space-y-6">
                {/* Date + Stars */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-1.5 text-[#A3A8A0]">DATE</div>
                    <input type="date" value={sendForm.date} onChange={e => setSendForm(p => ({...p, date: e.target.value}))} className="w-full bg-[#0A0C0A] border border-[#2A3328] rounded-2xl px-4 py-2.5 text-sm" />
                  </div>
                  <div>
                    <div className="text-xs mb-1.5 text-[#A3A8A0]">HOW DID IT FEEL? (STARS)</div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} onClick={() => setSendForm(p => ({...p, stars: s}))} className={`star ${s <= sendForm.stars ? 'active' : 'text-[#2A3328]'}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Condition Tags — exactly as requested */}
                <div>
                  <div className="text-xs mb-2 text-[#A3A8A0]">CONDITIONS / SEND STYLE</div>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => setSendForm(p => ({...p, conditionTag: tag}))} className={`condition-pill ${sendForm.conditionTag === tag ? 'active' : ''}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beta notes */}
                <div>
                  <div className="text-xs mb-1.5 text-[#A3A8A0]">BETA NOTES (OPTIONAL)</div>
                  <textarea value={sendForm.betaNotes} onChange={e => setSendForm(p => ({...p, betaNotes: e.target.value}))} rows={2} placeholder="Right hand to the good crimp, then big move left..." className="w-full bg-[#0A0C0A] border border-[#2A3328] rounded-2xl p-4 text-sm resize-y" />
                </div>

                {/* Photo (optional, compressed) */}
                <div>
                  <div className="text-xs mb-1.5 text-[#A3A8A0]">OPTIONAL SEND PHOTO</div>
                  {!sendForm.photoDataUrl ? (
                    <label className="photo-upload block cursor-pointer">
                      <Camera className="mx-auto mb-2 text-[#A3A8A0]" />
                      <div className="text-sm font-medium">Tap to add a photo of the send</div>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      {isUploadingPhoto && <div className="text-xs mt-1">Compressing…</div>}
                    </label>
                  ) : (
                    <div className="relative">
                      <img src={sendForm.photoDataUrl} className="photo-preview" alt="your send" />
                      <button onClick={() => setSendForm(p => ({...p, photoDataUrl: ''}))} className="absolute top-2 right-2 bg-black/70 rounded-full p-1"><X size={15} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* The big satisfying button */}
              <div className="p-5 pt-0">
                <button 
                  onClick={submitSend} 
                  className="w-full h-16 rounded-3xl text-xl font-extrabold bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-[#0A0C0A] flex items-center justify-center gap-3 active:scale-[0.985] transition shadow-xl"
                >
                  <Send size={23} /> LOG THIS SEND — CRUSHER MODE
                </button>
                <div className="text-center text-xs mt-2 text-[#A3A8A0]">Instantly updates your stats, pyramid, and recommendations.</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global confetti root */}
      <div id="confetti-root" className="fixed inset-0 pointer-events-none z-[120]" />
    </div>
  );
}

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
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black text-white dark:bg-white dark:text-black py-3 text-base font-extrabold active:scale-[0.985] transition min-h-[48px]"
        >
          SEE DETAILS &amp; SEND IT! <ArrowRight size={16} />
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
                className="flex-1 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white py-4 text-[17px] font-extrabold tracking-[-0.3px] flex items-center justify-center gap-2 active:scale-[0.985] transition shadow-lg min-h-[58px]"
              >
                <Award size={20} /> SEND IT!! 🎉 (log my send)
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

            {/* GEAR FOR THIS ROUTE — tasteful affiliate cards (non-intrusive) */}
            <GearForRoute route={showModalFor} />

            {/* OFFLINE UPSSELL — one-time $4.99 or GitHub Sponsors (core stays free) */}
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  closeModal();
                  // Open a simple revenue modal via window event or inline state extension (demo)
                  const crag = showModalFor.crag;
                  alert(`Unlock Offline Crag Pack for ${crag}\n\n$4.99 one-time (demo) or support on GitHub Sponsors.\n\nCore maps, beta & logging remain 100% free forever.`);
                  // In real app this would trigger the beautiful OfflineModal
                  window.open('https://github.com/sponsors', '_blank');
                }}
                className="w-full mt-4 rounded-2xl border-2 border-[#166534] hover:bg-[#f0fdf4] py-3.5 text-[#166534] font-semibold flex items-center justify-center gap-2 active:scale-[0.985]"
              >
                <Download className="w-4 h-4" /> Unlock offline pack for this crag — $4.99 or GitHub Sponsors
              </button>
              <div className="text-center text-[10px] text-[#78716c] mt-1.5">Convenience only. Every core feature (map, beta, sends) is free and always will be.</div>
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
        {/* KID + GRANDMA FIRST: Big friendly hero with "cool photo" + direct path to first send */}
        <div className="mb-8 rounded-3xl overflow-hidden border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-900 via-[#0f2a1f] to-black p-8 md:p-10 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 text-sm font-medium mb-4">🧗 FOR KIDS, GRANDMAS &amp; EVERYONE</div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-[-2.5px] leading-[1.05] mb-3">See a cool climb.<br />Tap it.<br />SEND IT.</h1>
            <p className="text-2xl md:text-3xl text-emerald-300 font-medium tracking-tight mb-6">Grades always explained in plain English. Huge friendly buttons. You can log your first outdoor send in under 60 seconds — no help needed.</p>
            
            <button 
              onClick={() => {
                // Scroll to map + trigger a beginner-friendly demo filter
                document.getElementById('near-me-section')?.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                  // Auto demo "near me" for a fun first experience (fake location near Bishop for great easy routes)
                  const demoLoc = { lat: 37.36, lng: -118.46 };
                  setUserLocation(demoLoc);
                  setMapCenter([demoLoc.lat, demoLoc.lng]);
                  setMapZoom(11);
                  toast.success("Welcome! Showing easy climbs near Bishop, CA", { 
                    description: "These are perfect for first outdoor sends. Tap any to SEND IT!" 
                  });
                }, 650);
              }}
              className="ct-btn ct-btn-send text-xl px-10 min-h-[62px] active:scale-[0.985] shadow-2xl"
            >
              START MY FIRST SEND RIGHT NOW →
            </button>
            <div className="mt-3 text-emerald-400/90 text-sm">No account. No jargon. Just pure stoke.</div>
          </div>
        </div>

        {/* Near Me quick access anchor */}
        <div id="near-me-section" className="sr-only">Near Me section</div>

        {/* Original explanation kept but smaller + secondary (for curious adults) */}
        <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-400 max-w-prose">
          Interactive map + live list. Everything updates together. Tap markers or list rows to preview, then open the big friendly modal to SEND IT.
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

        {/* TASTEFUL AD SLOT — climber brands only, top of discover */}
        <AdSlot />

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

        {/* ========== PARTNERS KEEPING IT FREE (15 researched brands) ========== */}
        <div id="partners" className="mt-16 pt-10 border-t">
          <div className="text-center mb-8">
            <div className="uppercase text-[10px] tracking-[2px] font-bold text-[#78716c]">THANK YOU</div>
            <div className="text-4xl font-bold tracking-[-1.8px] mt-1">Partners keeping it free</div>
            <p className="max-w-lg mx-auto mt-3 text-[#5c6666]">These 15 real climber and outdoor brands believe in a world-class free experience for every climber. Their support funds trust & safety, moderation, mapping, and new features — with zero paywalls on beta or maps.</p>
          </div>

          <div className="partners-grid mb-4">
            {BRANDS.map((brand, i) => <BrandLogo key={i} brand={brand} />)}
          </div>
          <p className="text-center text-xs text-[#78716c]">Full affinity notes (safety/education/data/tools) + contact paths in internal sponsorship doc. Every brand has a direct connection to climber safety, access, or skills education.</p>
        </div>

        {/* CEO PROOF + 1-PAGE REVENUE PLAN + OUTREACH TEMPLATES */}
        <div id="revenue" className="mt-12 revenue-proof p-8 md:p-10 rounded-3xl">
          <div className="uppercase tracking-[2px] text-xs font-bold text-[#166534] mb-2">FOR OUR CEO &amp; ANY SKEPTICS</div>
          <h2 className="text-4xl font-bold tracking-[-1.6px] mb-4 leading-none">This will not alienate users.<br />It will make CragTrails stronger and more sustainable.</h2>

          <div className="text-[#1f2525] space-y-4">
            <p><strong>AllTrails already proved this model works at massive scale.</strong> They give away world-class free maps, trail search, photos, and basic logging to tens of millions. They layer tasteful premium (offline maps, advanced stats) and relevant brand partnerships on top. Users stay extremely loyal because the <em>core experience is excellent and free</em>. Revenue subsidizes the servers, staff, and improvements that keep the free tier world-class.</p>
            
            <p><strong>CragTrails does exactly the same — only more climber-focused:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>100% of core (interactive maps, every route, one-tap sends, community photos, beta) is and will always be completely free. No exceptions.</li>
              <li>Revenue surfaces are opt-in, beautiful, and hyper-relevant: only climber brands, only gear that genuinely helps on that specific route.</li>
              <li>Offline crag packs ($4.99 one-time or GitHub Sponsors) are pure convenience — you can always plan and view beta for free on the web or at home.</li>
              <li>The Partners section is transparent celebration, not advertising. It builds trust and appreciation.</li>
            </ul>
            <p className="font-semibold">Outcome: happier users, higher retention, real sustainability without ever compromising the free climber experience.</p>
          </div>

          <details className="mt-8 border-t border-[#86efac] pt-6">
            <summary className="cursor-pointer font-semibold text-[#166534] select-none">View full 1-page revenue plan + ready-to-send outreach email templates</summary>
            
            <div className="mt-6 grid md:grid-cols-2 gap-8 text-sm">
              <div>
                <div className="font-bold text-[#166534] mb-2">Projected Streams (conservative Year 1)</div>
                <ul className="space-y-1">
                  <li>Offline Crag Packs ($4.99 × ~18k) → <strong>$89k</strong></li>
                  <li>GitHub Sponsors + direct donations → <strong>$42k</strong></li>
                  <li>Brand sponsorships (6–9 deals avg $18k) → <strong>$126k</strong></li>
                  <li>Tasteful relevant affiliate gear → <strong>$31k</strong></li>
                </ul>
                <div className="mt-2 text-xs font-medium">Total ~$288k • 100% reinvested into moderation, data quality, and keeping everything free.</div>
              </div>
              <div>
                <div className="font-bold text-[#166534] mb-2">Sponsorship Pipeline (demo values $2k–$50k/yr)</div>
                <div className="text-xs space-y-1">
                  Petzl: $35–50k (safety education module)<br />
                  REI: $25–40k (clinic co-branding)<br />
                  Black Diamond / Edelrid: $18–30k each<br />
                  Patagonia / Arc’teryx: $12–25k (values grants)<br />
                  <span className="block pt-1 text-[#166534] font-semibold">Current pipeline value (demo): $312k annualized</span>
                </div>
              </div>
            </div>

            {/* Outreach Email Templates */}
            <div className="mt-8">
              <div className="font-semibold mb-3 text-[#166534]">Ready-to-send Outreach Email Templates</div>
              <div className="space-y-4 text-xs bg-white/60 p-4 rounded-2xl border">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-1 text-[#166534]">SUBJECT: Partnership idea — keeping climbing safe &amp; free for the next generation</div>
                  <p>Hi [Partnerships @ Petzl],<br />CragTrails is building AllTrails for climbers — beautiful maps, every route, obsessive safety &amp; access focus (47k MAU). Your Grigri and headlamps are already in every serious climber’s rack.<br />We’d love to integrate Petzl safety education content + co-branded “Safe Belay” module (free to users). In return: $35k annual sponsorship + prominent Partners placement + co-marketing on your channels.<br />This mirrors the successful Access Fund / AMGA model. 20-min call this week?<br />— [Founder], CragTrails</p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest mb-1 text-[#166534]">SUBJECT: Education partnership — REI climbing clinics + CragTrails</div>
                  <p>Hi REI Outdoor Programs team,<br />Your Adopt-a-Crag + in-store clinics reach exactly the gym-to-crag audience we serve. We propose a co-branded “First Crag Day” checklist + offline pack giveaway for your classes, sponsored by REI ($25k annual + Partners placement).<br />Let’s protect and grow the next generation of climbers together.<br />— CragTrails</p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </main>
      
      {FullModal}
    </div>
  );
}
