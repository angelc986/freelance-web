"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Portal from "./Portal";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  address?: string;
  onLocationChange: (data: { lat: number; lng: number; address: string }) => void;
}

export default function LocationPicker({ lat, lng, address, onLocationChange }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState(address || "");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [searching, setSearching] = useState(false); // for autocomplete loading indicator

  // ── Refs to avoid closure-staleness & prevent callback churn ──
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const onLocationChangeRef = useRef(onLocationChange);
  latRef.current = lat;
  lngRef.current = lng;
  onLocationChangeRef.current = onLocationChange;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  // ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    if (modalOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  // ── Stable callbacks using refs (never cause re-creation) ──

  const reverseGeocode = useCallback(async (lati: number, lngi: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lati}&lon=${lngi}&addressdetails=1&accept-language=es`,
        { headers: { "User-Agent": "TurnoGO/1.0" } }
      );
      const data = await res.json();
      return data.display_name || `${lati.toFixed(4)}, ${lngi.toFixed(4)}`;
    } catch {
      return `${lati.toFixed(4)}, ${lngi.toFixed(4)}`;
    }
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`,
        { headers: { "User-Agent": "TurnoGO/1.0" } }
      );
      const data = await res.json();
      return data;
    } catch { return []; }
    finally { setSearching(false); }
  }, []);

  const moveMarker = useCallback(async (newLat: number, newLng: number) => {
    if (mapRef.current) mapRef.current.setView([newLat, newLng], 16);
    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
    const addr = await reverseGeocode(newLat, newLng);
    setSearchText(addr);
    onLocationChangeRef.current({ lat: newLat, lng: newLng, address: addr });
  }, [reverseGeocode]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    setMapLoading(true);
    const currentLat = latRef.current ?? 10.4806;
    const currentLng = lngRef.current ?? -66.9036;
    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      await moveMarker(pos.lat, pos.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
    map.whenReady(() => setMapLoading(false));
  }, [moveMarker]); // Only moveMarker — stable, never churns

  // Init/cleanup map on modal open/close only
  useEffect(() => {
    if (!modalOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }
    setMapLoading(true);
    const timer = setTimeout(() => initMap(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]); // <- ONLY modalOpen! No initMap in deps (it's stable via refs)

  // When lat/lng props change while map is loaded -> move the view
  useEffect(() => {
    if (modalOpen && mapRef.current && lat != null && lng != null) {
      mapRef.current.setView([lat, lng], 16);
      markerRef.current?.setLatLng([lat, lng]);
    }
  }, [lat, lng, modalOpen]);

  // Sync search text when address prop changes externally
  useEffect(() => {
    if (address !== undefined && address !== searchText) {
      setSearchText(address);
    }
    // Only run when address prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización"); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setModalOpen(true);
        // Wait for map to init, then move
        const waitForMap = setInterval(() => {
          if (mapRef.current) {
            clearInterval(waitForMap);
            moveMarker(pos.coords.latitude, pos.coords.longitude);
            setGettingLocation(false);
          }
        }, 100);
        // Safety timeout
        setTimeout(() => { clearInterval(waitForMap); setGettingLocation(false); }, 8000);
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === 1) alert("Permiso denegado. Activa la ubicación en tu navegador.");
        else alert("No se pudo obtener tu ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [moveMarker]);

  // Search state
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchText(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.length < 3) { setResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(async () => {
      const data = await searchAddress(val);
      if (data) { setResults(data); setShowResults(data.length > 0); }
    }, 350);
  };

  const selectResult = async (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setSearchText(item.display_name);
    setShowResults(false);
    const wasOpen = modalOpen;
    if (!wasOpen) setModalOpen(true);
    // Wait for map then move
    const tryMove = () => {
      if (mapRef.current) {
        moveMarker(newLat, newLng);
      } else if (!wasOpen) {
        // Map is still initializing — retry
        setTimeout(tryMove, 200);
      }
    };
    if (wasOpen) {
      // Map already loaded, move immediately
      moveMarker(newLat, newLng);
    } else {
      // Modal just opened, wait for map
      setTimeout(tryMove, 600);
    }
  };

  const confirmLocation = () => {
    setModalOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {/* ─── Search + GPS row ─── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchText}
            onChange={handleSearchInput}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Buscar dirección..."
            className="w-full px-2.5 py-1.5 text-[11px] bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#1E293B] font-medium outline-none transition-all placeholder:text-[#94A3B8] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((item, i) => (
                <button key={i} type="button" onMouseDown={() => selectResult(item)}
                  className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-blue-50 hover:text-primary border-b border-gray-50 last:border-0 transition-colors"
                >
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button" onClick={getCurrentLocation} disabled={gettingLocation}
          className="px-2.5 py-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-blue-50 hover:border-blue-200 hover:text-primary transition-all shrink-0 disabled:opacity-50"
          title="Usar mi ubicación"
        >
          {gettingLocation ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          )}
        </button>
      </div>

      {/* ─── Open map button ─── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex-1 py-1.5 text-[10px] font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          Ajustar en mapa
        </button>
        {lat != null && lng != null && (
          <div className="flex items-center gap-1 text-[9px] text-gray-400 shrink-0">
            <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            Ubicación seleccionada
          </div>
        )}
      </div>

      {modalOpen && (
        <Portal>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />

          {/* Modal panel */}
          <div
            className="relative w-full max-w-lg max-h-[95vh] md:max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl animate-modal-enter overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Close button ── */}
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center z-10"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* ── Header ── */}
            <div className="pt-5 pb-0 px-5 shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-sm text-dark block leading-tight">
                    Selecciona tu ubicación
                  </span>
                  <span className="text-[11px] text-gray">
                    Busca o arrastra el pin en el mapa
                  </span>
                </div>
              </div>
            </div>

            {/* ── Search ── */}
            <div className="px-5 pt-3 pb-2 shrink-0">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input
                  type="text"
                  value={searchText}
                  onChange={handleSearchInput}
                  placeholder="Buscar dirección..."
                  className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[#1E293B] outline-none transition-all placeholder:text-[#94A3B8] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                  autoFocus
                />
                {/* Search results dropdown */}
                {showResults && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/5 max-h-40 overflow-y-auto modal-scroll">
                    {results.map((item, i) => (
                      <button key={i} type="button" onMouseDown={() => selectResult(item)}
                        className="w-full text-left px-3.5 py-2.5 text-[12px] text-gray-700 hover:bg-primary-lighter hover:text-primary border-b border-gray-50 last:border-0 transition-colors flex items-start gap-2"
                      >
                        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span className="line-clamp-2 leading-snug">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Searching indicator */}
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* ── Map area ── */}
            <div className="flex-1 relative min-h-[280px] mx-5 mb-2 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
              {/* Loading skeleton */}
              {mapLoading && (
                <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="skeleton w-12 h-12 rounded-full mb-3" />
                  <div className="skeleton w-32 h-3 rounded mb-2" />
                  <div className="skeleton w-24 h-2.5 rounded" />
                </div>
              )}

              {/* Map container */}
              <div ref={mapContainerRef} className="absolute inset-0" />

              {/* Centered pin indicator (visual hint) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none drop-shadow-md">
                <svg className="w-8 h-8 text-primary -mt-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="3" fill="white" />
                </svg>
              </div>

              {/* GPS floating button */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="absolute bottom-3 right-3 z-[1000] w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-lg shadow-black/10 border border-gray-200/80 flex items-center justify-center hover:bg-primary-lighter hover:border-primary/30 hover:shadow-primary/10 transition-all disabled:opacity-50 group"
                title="Mi ubicación"
              >
                {gettingLocation ? (
                  <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                )}
              </button>

              {/* Zoom hint badge */}
              <div className="absolute top-3 left-3 z-[1000] bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-[9px] font-medium text-gray-500 shadow-sm border border-gray-100/50 flex items-center gap-1 pointer-events-none">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
                Arrastra el pin
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-5 pb-4 pt-1 shrink-0">
              <button
                type="button"
                onClick={confirmLocation}
                className="w-full py-2.5 bg-primary text-white font-semibold text-sm text-center rounded-xl hover:bg-primary-dark transition-all shadow-sm shadow-primary/20"
              >
                Confirmar ubicación
              </button>
              <p className="text-center text-[10px] text-gray mt-1.5 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5l3-3 3 3 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Arrastra el pin para ajustar con precisión
              </p>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}
