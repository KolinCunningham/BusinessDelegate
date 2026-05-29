'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getGradeColor, getDisplayGrade } from '@/lib/data/index';

// Self-contained Route type (also duplicated in page for simplicity)
export interface Route {
  id: number;
  name: string;
  crag: string;
  lat: number;
  lng: number;
  grade: string;           // legacy / fallback
  grades?: {
    yds?: string;
    french?: string;
    australian?: string;
    vScale?: string;
  };
  difficulty: number;
  popularity: number;
  type: 'Boulder' | 'Sport' | 'Trad';
  description: string;
  height?: number;
  stars: number;
}

// Fix for default icons (not used since we use CircleMarker, but safe)
if (typeof window !== 'undefined') {
  // @ts-expect-error - Leaflet icon path fix for SSR/bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export type GradeSystem = 'yds' | 'french' | 'ewbank' | 'uiaa' | 'vscale';

const GRADE_BANDS: Record<GradeSystem, { color: string; label: string }[]> = {
  yds:    [{ color:'#22c55e', label:'5.6–5.9' }, { color:'#eab308', label:'5.10' }, { color:'#f97316', label:'5.11–5.12' }, { color:'#ef4444', label:'5.13+' }],
  french: [{ color:'#22c55e', label:'4–5c' },   { color:'#eab308', label:'6a–6c+' }, { color:'#f97316', label:'7a–7c' },   { color:'#ef4444', label:'8a+' }],
  ewbank: [{ color:'#22c55e', label:'1–16' },    { color:'#eab308', label:'17–22' }, { color:'#f97316', label:'23–27' },   { color:'#ef4444', label:'28+' }],
  uiaa:   [{ color:'#22c55e', label:'III–V+' },  { color:'#eab308', label:'VI–VII+' }, { color:'#f97316', label:'VIII–IX' }, { color:'#ef4444', label:'X+' }],
  vscale: [{ color:'#22c55e', label:'V0–V2' },   { color:'#eab308', label:'V3–V5' }, { color:'#f97316', label:'V6–V8' },  { color:'#ef4444', label:'V9+' }],
};

export interface CragMapProps {
  routes: Route[];
  selectedRouteId: number | null;
  onMarkerClick: (route: Route) => void;
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  userLocation?: { lat: number; lng: number } | null;
  gradeSystem?: GradeSystem;
}

// Popularity -> radius (heatmap-ish)
function getMarkerRadius(popularity: number, isSelected: boolean): number {
  // BIGGER for 10yo / grandma fingers: min ~14px (28px diameter) tap-friendly
  const base = 14 + Math.floor(popularity / 11); 
  return isSelected ? base + 6 : base;
}

// Small jitter so overlapping crag routes don't stack exactly
function jitterCoord(coord: number, seed: number): number {
  return coord + (Math.sin(seed) * 0.0006 + Math.cos(seed * 1.3) * 0.00035);
}

function RouteMarkers({ routes, selectedRouteId, onMarkerClick }: { 
  routes: Route[]; 
  selectedRouteId: number | null; 
  onMarkerClick: (r: Route) => void;
}) {
  const map = useMap();

  // Simple client-side clustering for density at low zoom
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom()),
  });

  const isClustered = zoom < 11; // Cluster below zoom 11 for overview density

  const displayItems = useMemo(() => {
    if (!isClustered) {
      return routes.map((route, idx) => ({
        id: route.id,
        lat: jitterCoord(route.lat, idx),
        lng: jitterCoord(route.lng, idx + 7),
        route,
        isCluster: false,
        count: 1,
      }));
    }

    // Group by crag for cluster view (density visualization)
    const groups = new Map<string, Route[]>();
    routes.forEach((r) => {
      if (!groups.has(r.crag)) groups.set(r.crag, []);
      groups.get(r.crag)!.push(r);
    });

    return Array.from(groups.entries()).map(([crag, groupRoutes], idx) => {
      // Centroid of the group
      const avgLat = groupRoutes.reduce((s, r) => s + r.lat, 0) / groupRoutes.length;
      const avgLng = groupRoutes.reduce((s, r) => s + r.lng, 0) / groupRoutes.length;
      // Representative route = highest popularity
      const rep = [...groupRoutes].sort((a, b) => b.popularity - a.popularity)[0];
      return {
        id: rep.id,
        lat: avgLat,
        lng: avgLng,
        route: rep,
        isCluster: true,
        count: groupRoutes.length,
        allRoutes: groupRoutes,
      };
    });
  }, [routes, isClustered]);

  return (
    <>
      {displayItems.map((item, index) => {
        const isSelected = !item.isCluster && item.id === selectedRouteId;
        const color = getGradeColor(item.route.grade);
        const radius = item.isCluster 
          ? Math.max(18, 16 + item.count * 1.8)  // Much larger clusters = easy big tap targets for kids/grandmas
          : getMarkerRadius(item.route.popularity, isSelected);

        return (
          <CircleMarker
            key={`${item.id}-${index}-${isClustered ? 'cluster' : 'single'}`}
            center={[item.lat, item.lng]}
            radius={radius}
            pathOptions={{
              color: '#fff',
              weight: item.isCluster ? 2 : (isSelected ? 3 : 1.5),
              fillColor: color,
              fillOpacity: item.isCluster ? 0.85 : (isSelected ? 0.95 : 0.75 + (item.route.popularity / 400)),
            }}
            eventHandlers={{
              click: () => {
                if (item.isCluster) {
                  // Cluster: zoom in only, no popup
                  map.flyTo([item.lat, item.lng], Math.min(14, zoom + 3), { duration: 0.5 });
                } else {
                  onMarkerClick(item.route);
                }
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95} className="font-sans text-xs">
              {item.isCluster 
                ? `${item.count} routes @ ${item.route.crag} — click to zoom` 
                : `${item.route.name} • ${getDisplayGrade(item.route.grades, undefined, undefined)} • ${item.route.crag} • ★${item.route.stars} • ${item.route.type} • ${item.route.popularity} sends`}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

// Inner component that receives map instance
function MapController({ center, zoom, onMapReady, routes }: {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  routes?: Route[];
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  // Auto-fit to all routes on first load (helps users on wrong continent)
  useEffect(() => {
    if (fittedRef.current || !routes || routes.length === 0 || center) return;
    const validRoutes = routes.filter(r => r.lat && r.lng && Math.abs(r.lat) > 0.001);
    if (validRoutes.length === 0) return;
    const lats = validRoutes.map(r => r.lat);
    const lngs = validRoutes.map(r => r.lng);
    const bounds: L.LatLngBoundsExpression = [
      [Math.min(...lats) - 1, Math.min(...lngs) - 1],
      [Math.max(...lats) + 1, Math.max(...lngs) + 1],
    ];
    setTimeout(() => {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7 });
      fittedRef.current = true;
    }, 300);
  }, [routes, map, center]);

  // Critical fix for maps rendered inside tabs or conditionally:
  // Leaflet often initializes with wrong size, which locks the ability to zoom out.
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Also invalidate when the map is interacted with after mount (helps with tab switches)
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);

  return null;
}

export default function CragMap({
  routes,
  selectedRouteId,
  onMarkerClick,
  center,
  zoom = 7,
  onMapReady,
  userLocation,
  gradeSystem = 'yds',
}: CragMapProps) {
  const defaultCenter: [number, number] = [37.6, -118.9];
  const [satellite, setSatellite] = useState(false);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-[#E5E2D9] shadow-xl bg-[#F8F7F4]">
      <MapContainer
        center={center ?? defaultCenter}
        zoom={zoom}
        className="h-full w-full"
        style={{ background: '#F8F7F4' }}
        zoomControl={true}
        attributionControl={true}
        minZoom={2}
        maxZoom={18}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
      >
        {satellite ? (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
            noWrap={true}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            noWrap={true}
          />
        )}

        <RouteMarkers 
          routes={routes} 
          selectedRouteId={selectedRouteId} 
          onMarkerClick={onMarkerClick} 
        />

        {/* Your location marker — bright blue, distinct from climb pins, 10yo-friendly "You are here" */}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={13}
            pathOptions={{
              color: '#1e3a8a',      // Deep blue border for strong contrast
              weight: 4,
              fillColor: '#3b82f6',  // Bright friendly blue
              fillOpacity: 0.92,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95} className="font-sans text-xs">
              You are here
            </Tooltip>
          </CircleMarker>
        )}

        <MapController
          center={center}
          zoom={zoom}
          onMapReady={onMapReady}
          routes={routes}
        />
      </MapContainer>

      {/* Satellite / Street toggle */}
      <button
        onClick={() => setSatellite(s => !s)}
        className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E2D9] shadow text-[#1F2525] hover:bg-white transition-colors flex items-center gap-1.5"
      >
        {satellite ? '🗺 Street' : '🛰 Satellite'}
      </button>

      {/* Grade legend — shows real grades for the active system */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur px-3 py-2 rounded-xl text-xs font-medium border border-[#E5E2D9] shadow text-[#1F2525] flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {GRADE_BANDS[gradeSystem].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="text-[11px] opacity-70">Big circles = popular climbs</div>
      </div>

      {/* Bonus: offline map hint */}
      <div className="absolute top-3 left-3 z-[1000] max-w-[210px] rounded-md bg-white/95 text-[#5C6666] px-2.5 py-1 text-[9px] leading-tight backdrop-blur font-mono tracking-tight border border-[#E5E2D9]">
        OSM tiles. <span className="opacity-75">Offline? Cache tiles via plugins or use dedicated offline maps.</span>
      </div>
    </div>
  );
}
