import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import type { Route } from '@/lib/types';

// ---------------------------------------------------------------------------
// Route detail page — /route/[id]
// Reads from public/mp-routes.json (static; no DB).
// URL uses the numeric MP id, e.g. /route/105732422
// ---------------------------------------------------------------------------

function loadRoutes(): Route[] {
  const file = path.join(process.cwd(), 'public', 'mp-routes.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Route[];
}

function getRoute(id: string): Route | undefined {
  const routes = loadRoutes();
  return routes.find(r => r.id === `mp_${id}` || r.id === id);
}

export async function generateStaticParams() {
  const routes = loadRoutes();
  return routes.map(r => ({ id: r.id.replace(/^mp_/, '') }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const route = getRoute(id);
  if (!route) return { title: 'Route Not Found' };
  return {
    title: `${route.name} (${route.grade}) — ${route.areaName}`,
    description: route.description?.slice(0, 160) || `${route.type} climbing route at ${route.areaName}`,
  };
}

// Grade color helper (same logic as lib/data/index.ts getGradeColor)
function gradeColor(grade: string): string {
  const g = (grade || '').toUpperCase().trim();
  let num = 0;
  let system: 'v' | 'yds' | 'other' = 'other';
  if (g.startsWith('V')) { system = 'v'; num = parseInt(g.replace(/[^0-9]/g, '')) || 0; }
  else if (g.includes('5.')) { system = 'yds'; const m = g.match(/5\.(\d+)/); num = m ? parseInt(m[1]) : 10; }
  if (system === 'v') {
    if (num <= 2) return '#22c55e';
    if (num <= 5) return '#eab308';
    if (num <= 8) return '#f97316';
    return '#ef4444';
  }
  if (system === 'yds') {
    if (num <= 9) return '#22c55e';
    if (num <= 10) return '#eab308';
    if (num <= 11) return '#f97316';
    return '#ef4444';
  }
  return '#eab308';
}

function gradeBg(grade: string): string {
  const c = gradeColor(grade);
  const map: Record<string, string> = {
    '#22c55e': 'bg-green-500',
    '#eab308': 'bg-yellow-500',
    '#f97316': 'bg-orange-500',
    '#ef4444': 'bg-red-500',
  };
  return map[c] || 'bg-yellow-500';
}

function typePill(type: string): { label: string; className: string } {
  if (type === 'Boulder') return { label: 'Boulder', className: 'bg-purple-100 text-purple-800' };
  if (type === 'Trad') return { label: 'Trad', className: 'bg-amber-100 text-amber-800' };
  if (type === 'Sport') return { label: 'Sport', className: 'bg-sky-100 text-sky-800' };
  return { label: type, className: 'bg-gray-100 text-gray-700' };
}

function Stars({ count, max = 5 }: { count: number; max?: number }) {
  const full = Math.round(count);
  return (
    <span className="flex items-center gap-0.5" aria-label={`${count} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i < full ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function OsmMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  // Static OSM tile embed — no JS required, works in SSR
  const z = 14;
  const tile = `https://tile.openstreetmap.org/${z}/${Math.floor(((lng + 180) / 360) * Math.pow(2, z))}/${Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, z)
  )}.png`;

  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;

  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${name} in OpenStreetMap`}
      className="block rounded-2xl overflow-hidden border border-[#E5E2D9] hover:opacity-90 transition-opacity"
    >
      <div className="relative bg-[#e8ead1]" style={{ paddingBottom: '56.25%' }}>
        {/* Static map image via OSM static API */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=600x300&markers=${lat},${lng},red`}
          alt={`Map showing ${name} at ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-[#5C6666] font-mono">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      </div>
      <div className="px-3 py-2 bg-white text-xs text-[#5C6666] flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        View on OpenStreetMap →
      </div>
    </a>
  );
}

export default async function RoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const route = getRoute(id);

  if (!route) {
    // Route not in our static 3000 — show a friendly fallback
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🪨</div>
        <h1 className="text-3xl font-bold text-[#1F2525] mb-2">Route Not Yet Indexed</h1>
        <p className="text-[#5C6666] max-w-sm mb-6">
          We have 3,000+ popular routes ready, but this one isn't in our static set yet. Check back soon as we expand our database!
        </p>
        <Link
          href="/"
          className="px-8 py-3 rounded-3xl bg-[#166534] text-white font-extrabold text-base hover:bg-[#14532D] transition-colors"
        >
          Back to CragTrails
        </Link>
      </div>
    );
  }

  const pill = typePill(route.type);
  const color = gradeColor(route.grade);
  const areaId = route.areaId?.replace(/^mp_area_/, '');
  const numericId = route.id.replace(/^mp_/, '');

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E2D9] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#166534] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7M12 3v18" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-[-1px] text-[#1F2525]">CragTrails</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[#166534] font-semibold hover:underline"
          >
            ← All Routes
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Hero section */}
        <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 md:p-8 shadow-sm">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-[#5C6666] mb-4 flex-wrap">
            <Link href="/" className="hover:text-[#166534] transition-colors">CragTrails</Link>
            <span>›</span>
            {areaId ? (
              <Link href={`/area/${areaId}`} className="hover:text-[#166534] transition-colors">
                {route.areaName}
              </Link>
            ) : (
              <span>{route.areaName}</span>
            )}
            <span>›</span>
            <span className="text-[#1F2525] font-medium truncate max-w-[180px]">{route.name}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1F2525] leading-tight">
              {route.name}
            </h1>
            <span
              className="flex-shrink-0 text-xl font-extrabold px-4 py-1.5 rounded-2xl text-white"
              style={{ background: color }}
            >
              {route.grade}
            </span>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${pill.className}`}>
              {pill.label}
            </span>
            {route.lengthFt && (
              <span className="text-sm text-[#5C6666] bg-[#F8F7F4] px-3 py-1 rounded-full">
                📏 {route.lengthFt} ft
              </span>
            )}
            {route.pitches && route.pitches > 1 && (
              <span className="text-sm text-[#5C6666] bg-[#F8F7F4] px-3 py-1 rounded-full">
                {route.pitches} pitches
              </span>
            )}
          </div>

          {/* Stars & popularity */}
          <div className="flex items-center gap-3 mb-5">
            {route.stars > 0 ? (
              <>
                <Stars count={route.stars} />
                <span className="text-sm text-[#5C6666]">
                  {route.starVotes
                    ? `${route.starVotes.toLocaleString()} ratings`
                    : `${route.stars}/5 stars`}
                </span>
              </>
            ) : (
              <span className="text-sm text-[#5C6666]">
                {route.ticks ? `${route.ticks.toLocaleString()} sends` : 'No ratings yet'}
              </span>
            )}
            {route.ticks != null && route.ticks > 0 && (
              <span className="text-sm text-[#5C6666]">• 👥 {route.ticks.toLocaleString()} sends logged</span>
            )}
          </div>

          {/* Action button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-3xl bg-[#22C55E] text-[#0A0C0A] font-extrabold text-base hover:bg-[#16a34a] transition-colors shadow-lg"
          >
            SEND IT 🧗
          </Link>
        </div>

        {/* Photo placeholder */}
        <div className="bg-[#E5E2D9] rounded-3xl flex flex-col items-center justify-center py-16 border border-[#D1CECC]">
          <svg className="w-12 h-12 text-[#9CA3AF] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[#9CA3AF] font-semibold text-lg">Photos coming soon</p>
          <p className="text-[#9CA3AF] text-sm mt-1">Be the first to upload a send photo</p>
        </div>

        {/* Description + Details grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Description (2/3) */}
          <div className="md:col-span-2 space-y-6">
            {route.description && (
              <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1F2525] mb-3">About This Route</h2>
                <p className="text-[#5C6666] leading-relaxed text-[15px]">
                  {route.description}
                </p>
                {(route as any).url && (
                  <a
                    href={(route as any).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-4 text-sm text-[#166534] font-semibold hover:underline"
                  >
                    Read full description on Mountain Project ↗
                  </a>
                )}
              </div>
            )}

            {route.protection && (
              <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1F2525] mb-3">Protection / Gear</h2>
                <p className="text-[#5C6666] leading-relaxed text-[15px]">{route.protection}</p>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-4">
            {/* Quick facts */}
            <div className="bg-white rounded-3xl border border-[#E5E2D9] p-5 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-[#1F2525]">Quick Facts</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5C6666]">Grade</dt>
                  <dd>
                    <span
                      className="font-extrabold px-2.5 py-0.5 rounded-full text-white text-xs"
                      style={{ background: color }}
                    >
                      {route.grade}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5C6666]">Type</dt>
                  <dd className="font-semibold text-[#1F2525]">{route.type}</dd>
                </div>
                {route.lengthFt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#5C6666]">Length</dt>
                    <dd className="font-semibold text-[#1F2525]">{route.lengthFt} ft</dd>
                  </div>
                )}
                {route.pitches && route.pitches > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#5C6666]">Pitches</dt>
                    <dd className="font-semibold text-[#1F2525]">{route.pitches}</dd>
                  </div>
                )}
                {route.fa && route.fa !== 'Unknown' && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-[#5C6666]">First Ascent (FA)</dt>
                    <dd className="font-medium text-[#1F2525] text-xs leading-snug">{route.fa}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5C6666]">Area</dt>
                  <dd className="font-semibold text-[#1F2525] text-right">
                    {areaId ? (
                      <Link href={`/area/${areaId}`} className="text-[#166534] hover:underline">
                        {route.areaName}
                      </Link>
                    ) : (
                      route.areaName
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#5C6666]">Source</dt>
                  <dd className="font-medium text-[#1F2525]">Mountain Project</dd>
                </div>
              </dl>
            </div>

            {/* GPS / Map */}
            {route.lat && route.lng && (
              <div className="bg-white rounded-3xl border border-[#E5E2D9] p-5 shadow-sm">
                <h2 className="text-base font-bold text-[#1F2525] mb-3">Location</h2>
                <OsmMap lat={route.lat} lng={route.lng} name={route.name} />
              </div>
            )}
          </div>
        </div>

        {/* Area link */}
        {areaId && (
          <div className="bg-[#DCFCE7] border border-[#166534]/20 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#166534]">More routes in this area</p>
              <p className="text-base font-extrabold text-[#1F2525]">{route.areaName}</p>
            </div>
            <Link
              href={`/area/${areaId}`}
              className="flex-shrink-0 px-5 py-2.5 rounded-2xl bg-[#166534] text-white font-extrabold text-sm hover:bg-[#14532D] transition-colors"
            >
              Browse Area →
            </Link>
          </div>
        )}

        {/* Back CTA */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-3xl bg-[#166534] text-white font-extrabold text-lg hover:bg-[#14532D] transition-colors shadow-xl"
          >
            SEND IT — Back to CragTrails
          </Link>
          <p className="text-[#5C6666] text-sm mt-3">Log your sends, track progress, find climbs near you</p>
        </div>
      </main>
    </div>
  );
}
