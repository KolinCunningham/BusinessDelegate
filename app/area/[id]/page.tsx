import type { Metadata } from 'next';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import type { Route } from '@/lib/types';

// ---------------------------------------------------------------------------
// Area page — /area/[id]
// Shows all routes in a given area from public/mp-routes.json.
// Area id is the slugified last segment of the area_path (mp_area_<slug>).
// ---------------------------------------------------------------------------

function loadRoutes(): Route[] {
  const file = path.join(process.cwd(), 'public', 'mp-routes.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Route[];
}

function getAreaRoutes(areaId: string): { areaName: string; routes: Route[] } {
  const all = loadRoutes();
  // Match both prefixed and non-prefixed areaId forms
  const fullId = areaId.startsWith('mp_area_') ? areaId : `mp_area_${areaId}`;
  const routes = all.filter(r => r.areaId === fullId || r.areaId === areaId);
  const areaName = routes[0]?.areaName ?? areaId.replace(/^mp_area_/, '').replace(/-/g, ' ');
  return { areaName, routes };
}

export async function generateStaticParams() {
  const routes = loadRoutes();
  const ids = new Set(routes.map(r => r.areaId?.replace(/^mp_area_/, '') ?? ''));
  ids.delete('');
  return Array.from(ids).map(id => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { areaName, routes } = getAreaRoutes(id);
  return {
    title: `${areaName} — Climbing Routes`,
    description: `${routes.length} climbing routes at ${areaName}. Grades, descriptions, and beta for ${routes.map(r => r.name).slice(0, 3).join(', ')}${routes.length > 3 ? ` and ${routes.length - 3} more` : ''}.`,
  };
}

// Grade color (same bucketing as lib/data/index)
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

function typePill(type: string): { label: string; className: string } {
  if (type === 'Boulder') return { label: 'Boulder', className: 'bg-purple-100 text-purple-800' };
  if (type === 'Trad') return { label: 'Trad', className: 'bg-amber-100 text-amber-800' };
  if (type === 'Sport') return { label: 'Sport', className: 'bg-sky-100 text-sky-800' };
  return { label: type, className: 'bg-gray-100 text-gray-700' };
}

function Stars({ count }: { count: number }) {
  const full = Math.round(count);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < full ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default async function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { areaName, routes } = getAreaRoutes(id);

  if (routes.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🏔️</div>
        <h1 className="text-3xl font-bold text-[#1F2525] mb-2">Area Not Found</h1>
        <p className="text-[#5C6666] max-w-sm mb-6">
          This area isn't in our current dataset. We're constantly adding more crags!
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

  // Sort by stars desc, then ticks desc
  const sorted = [...routes].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || (b.ticks ?? 0) - (a.ticks ?? 0));

  const typeBreakdown = routes.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});

  const avgGrade = (() => {
    const grades = routes.map(r => r.grade).filter(Boolean);
    return grades[Math.floor(grades.length / 2)] ?? '';
  })();

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E2D9] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#166534] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7M12 3v18" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-[-1px] text-[#1F2525]">CragTrails</span>
          </Link>
          <Link href="/" className="text-sm text-[#166534] font-semibold hover:underline">
            ← All Crags
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Hero */}
        <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 md:p-8 shadow-sm">
          <nav className="flex items-center gap-1.5 text-sm text-[#5C6666] mb-4 flex-wrap">
            <Link href="/" className="hover:text-[#166534] transition-colors">CragTrails</Link>
            <span>›</span>
            <span className="text-[#1F2525] font-medium">{areaName}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1F2525] mb-3">
            {areaName}
          </h1>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-sm">
            <div className="flex items-center gap-1.5 bg-[#DCFCE7] px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="font-bold text-[#166534]">{routes.length} routes</span>
            </div>
            {Object.entries(typeBreakdown).map(([t, n]) => {
              const pill = typePill(t);
              return (
                <span key={t} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${pill.className}`}>
                  {n} {t}
                </span>
              );
            })}
            {avgGrade && (
              <span className="text-[#5C6666]">
                Typical grade: <strong className="text-[#1F2525]">{avgGrade}</strong>
              </span>
            )}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-3xl bg-[#22C55E] text-[#0A0C0A] font-extrabold text-base hover:bg-[#16a34a] transition-colors shadow-lg"
          >
            SEND IT — Log a route here 🧗
          </Link>
        </div>

        {/* Route grid */}
        <div>
          <h2 className="text-xl font-bold text-[#1F2525] mb-4">
            All Routes in {areaName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(route => {
              const numericId = route.id.replace(/^mp_/, '');
              const color = gradeColor(route.grade);
              const pill = typePill(route.type);
              return (
                <Link
                  key={route.id}
                  href={`/route/${numericId}`}
                  className="bg-white rounded-3xl border border-[#E5E2D9] p-5 shadow-sm hover:shadow-md hover:border-[#166534]/30 transition-all group"
                >
                  {/* Top row: name + grade */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-[17px] text-[#1F2525] leading-snug group-hover:text-[#166534] transition-colors flex-1">
                      {route.name}
                    </h3>
                    <span
                      className="flex-shrink-0 text-sm font-extrabold px-2.5 py-0.5 rounded-xl text-white"
                      style={{ background: color }}
                    >
                      {route.grade}
                    </span>
                  </div>

                  {/* Type pill */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${pill.className}`}>
                      {pill.label}
                    </span>
                    {route.lengthFt && (
                      <span className="text-xs text-[#5C6666]">{route.lengthFt} ft</span>
                    )}
                    {route.pitches && route.pitches > 1 && (
                      <span className="text-xs text-[#5C6666]">{route.pitches}p</span>
                    )}
                  </div>

                  {/* Stars + sends */}
                  <div className="flex items-center gap-2 mb-3">
                    {route.stars > 0 && <Stars count={route.stars} />}
                    {route.ticks != null && route.ticks > 0 && (
                      <span className="text-xs text-[#5C6666]">
                        {route.ticks.toLocaleString()} sends
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  {route.description && (
                    <p className="text-xs text-[#5C6666] leading-relaxed line-clamp-2">
                      {route.description}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="mt-3 text-xs font-bold text-[#166534] group-hover:underline">
                    View full details →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Back CTA */}
        <div className="text-center pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-3xl bg-[#166534] text-white font-extrabold text-lg hover:bg-[#14532D] transition-colors shadow-xl"
          >
            Back to CragTrails Map
          </Link>
        </div>
      </main>
    </div>
  );
}
