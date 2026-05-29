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
  /** Set to true once the full (async) route set has finished loading */
  routesLoaded?: boolean;
}

// Popularity -> radius (zoom-aware, capped)
function getMarkerRadius(popularity: number, isSelected: boolean, zoom: number): number {
  // Scale with zoom: smaller at low zoom, larger when zoomed in
  const zoomScale = Math.max(1, (zoom - 8) * 0.8);
  // Popularity adds at most 4px
  const popBonus = Math.min(4, popularity / 500);
  const base = Math.min(10, 4 + zoomScale + popBonus);
  return isSelected ? base + 3 : base;
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

  // Three clustering tiers:
  //   zoom >= 11 → individual dots with jitter
  //   zoom 7–10  → group by crag name (same-area routes share a pin)
  //   zoom <= 6  → geographic grid clustering (round lat/lng to 1 decimal) to avoid
  //                country-scale stacking of crags that share GPS coords
  const clusterMode: 'none' | 'crag' | 'geo' =
    zoom >= 13 ? 'none' : zoom >= 8 ? 'crag' : 'geo';

  const displayItems = useMemo(() => {
    if (clusterMode === 'none') {
      return routes.map((route, idx) => ({
        id: route.id,
        lat: jitterCoord(route.lat, idx),
        lng: jitterCoord(route.lng, idx + 7),
        route,
        isCluster: false,
        count: 1,
        allRoutes: [route] as Route[],
      }));
    }

    // Build cluster key based on mode
    const getKey = (r: Route) =>
      clusterMode === 'crag'
        ? r.crag
        : `${Math.round(r.lat * 10) / 10},${Math.round(r.lng * 10) / 10}`;

    const groups = new Map<string, Route[]>();
    routes.forEach((r) => {
      const key = getKey(r);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });

    return Array.from(groups.entries()).map(([, groupRoutes]) => {
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
  }, [routes, clusterMode]);

  return (
    <>
      {displayItems.map((item, index) => {
        const isSelected = !item.isCluster && item.id === selectedRouteId;
        const color = getGradeColor(item.route.grade);
        const radius = item.isCluster
          ? Math.min(24, 8 + Math.log2(item.count + 1) * 3)  // log scale, max 24px
          : getMarkerRadius(item.route.popularity, isSelected, zoom);

        return (
          <CircleMarker
            key={`${item.id}-${index}-${clusterMode}`}
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
                  // Fit to the bounding box of all routes in this cluster so it
                  // always zooms far enough to break the cluster apart.
                  const lats = item.allRoutes.map((r: Route) => r.lat);
                  const lngs = item.allRoutes.map((r: Route) => r.lng);
                  const clusterBounds: L.LatLngBoundsExpression = [
                    [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
                    [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5],
                  ];
                  map.flyToBounds(clusterBounds, { padding: [40, 40], maxZoom: 13, duration: 0.6 });
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
function MapController({ center, zoom, onMapReady, routes, routesLoaded }: {
  center?: [number, number];
  zoom?: number;
  onMapReady?: (map: L.Map) => void;
  routes?: Route[];
  routesLoaded?: boolean;
}) {
  const map = useMap();
  // Only block re-fitting once the user has manually interacted with the map.
  const userInteractedRef = useRef(false);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (onMapReady) onMapReady(map);
  }, [map, onMapReady]);

  // Track manual user interaction so we don't override their pan/zoom
  useMapEvents({
    dragstart: () => { userInteractedRef.current = true; },
    zoomstart: () => { userInteractedRef.current = true; },
  });

  // Auto-fit to all routes once the full route set has loaded.
  // routesLoaded=true means MP routes are done — fit to the complete dataset.
  // If routesLoaded is not provided (legacy usage) fall back to fitting on any
  // non-empty routes array, but still respect user interaction.
  useEffect(() => {
    const readyToFit = routesLoaded !== undefined ? routesLoaded : true;
    if (!readyToFit || fittedRef.current || userInteractedRef.current) return;
    if (!routes || routes.length === 0 || center) return;
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
  }, [routes, routesLoaded, map, center]);

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
  routesLoaded,
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
          routesLoaded={routesLoaded}
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
        <div className="text-[11px] opacity-70">Zoom in to see individual routes</div>
      </div>

      {/* Bonus: offline map hint */}
      <div className="absolute top-3 left-3 z-[1000] max-w-[210px] rounded-md bg-white/95 text-[#5C6666] px-2.5 py-1 text-[9px] leading-tight backdrop-blur font-mono tracking-tight border border-[#E5E2D9]">
        OSM tiles. <span className="opacity-75">Offline? Cache tiles via plugins or use dedicated offline maps.</span>
      </div>
    </div>
  );
}
