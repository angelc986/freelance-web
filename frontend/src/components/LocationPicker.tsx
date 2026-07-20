"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths (Webpack/web dev)
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
  const [mapReady, setMapReady] = useState(false);
  const [searchText, setSearchText] = useState(address || "");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const defaultLat = lat || 10.4806; // Default: Caracas
  const defaultLng = lng || -66.9036;

  // Reverse geocode: coords → address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
        { headers: { "User-Agent": "TurnoGO/1.0" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Search address via Nominatim
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`,
        { headers: { "User-Agent": "TurnoGO/1.0" } }
      );
      return await res.json();
    } catch {
      return [];
    }
  }, []);

  // Move marker to new position
  const moveMarker = useCallback(async (newLat: number, newLng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([newLat, newLng], 16);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
    const addr = await reverseGeocode(newLat, newLng);
    setSearchText(addr);
    onLocationChange({ lat: newLat, lng: newLng, address: addr });
  }, [reverseGeocode, onLocationChange]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await moveMarker(pos.coords.latitude, pos.coords.longitude);
        setGettingLocation(false);
        if (!pickerOpen) setPickerOpen(true);
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === 1) alert("Permiso denegado. Activa la ubicación en tu navegador.");
        else alert("No se pudo obtener tu ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [moveMarker, pickerOpen]);

  // Auto-get location on first mount if no coords
  useEffect(() => {
    if (!lat && !lng && navigator.geolocation) {
      getCurrentLocation();
    }
  }, []);

  // Init map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      marker.on("dragend", async () => {
        const pos = marker.getLatLng();
        await moveMarker(pos.lat, pos.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Search results state
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
    }, 400);
  };

  const selectResult = async (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setSearchText(item.display_name);
    setShowResults(false);
    await moveMarker(newLat, newLng);
    if (!pickerOpen) setPickerOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* Search + GPS button row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchText}
            onChange={handleSearchInput}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Buscar dirección..."
            className="w-full px-2.5 py-1.5 text-[11px] bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#1E293B] font-medium outline-none transition-all placeholder:text-[#94A3B8]"
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => selectResult(item)}
                  className="w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-blue-50 hover:text-primary border-b border-gray-50 last:border-0 transition-colors"
                >
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="px-2.5 py-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-blue-50 hover:border-blue-200 hover:text-primary transition-all shrink-0 disabled:opacity-50"
        >
          {gettingLocation ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          )}
        </button>
      </div>

      {/* Map toggle */}
      {!pickerOpen ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full py-1.5 text-[10px] font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          Ajustar en mapa
        </button>
      ) : (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div ref={mapContainerRef} className="h-32 w-full" />
          <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-t border-gray-100">
            <span className="text-[9px] text-gray-400">Arrastra el pin</span>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="text-[9px] font-medium text-gray-500 hover:text-primary transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
