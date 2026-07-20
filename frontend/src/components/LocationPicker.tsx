"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  const defaultLat = lat || 10.4806;
  const defaultLng = lng || -66.9036;

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

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`,
        { headers: { "User-Agent": "TurnoGO/1.0" } }
      );
      return await res.json();
    } catch { return []; }
  }, []);

  const moveMarker = useCallback(async (newLat: number, newLng: number) => {
    if (mapRef.current) mapRef.current.setView([newLat, newLng], 16);
    if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
    const addr = await reverseGeocode(newLat, newLng);
    setSearchText(addr);
    onLocationChange({ lat: newLat, lng: newLng, address: addr });
  }, [reverseGeocode, onLocationChange]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      await moveMarker(pos.lat, pos.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
  }, [defaultLat, defaultLng, moveMarker]);

  // Init/cleanup map on modal open/close
  useEffect(() => {
    if (!modalOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }
    const timer = setTimeout(() => initMap(), 300);
    return () => clearTimeout(timer);
  }, [modalOpen, initMap]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización"); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setModalOpen(true);
        setTimeout(async () => {
          await moveMarker(pos.coords.latitude, pos.coords.longitude);
          setGettingLocation(false);
        }, 500);
      },
      (err) => {
        setGettingLocation(false);
        if (err.code === 1) alert("Permiso denegado. Activa la ubicación en tu navegador.");
        else alert("No se pudo obtener tu ubicación: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [moveMarker]);

  // Auto-get location on first mount
  useEffect(() => {
    if (!lat && !lng && navigator.geolocation) getCurrentLocation();
  }, []);

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
    }, 400);
  };

  const selectResult = async (item: any) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setSearchText(item.display_name);
    setShowResults(false);
    setModalOpen(true);
    setTimeout(async () => { await moveMarker(newLat, newLng); }, 500);
  };

  const confirmLocation = () => {
    setModalOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {/* Search + GPS row */}
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

      {/* Open map button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex-1 py-1.5 text-[10px] font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          Ajustar en mapa
        </button>
        {/* Show small preview badge when location is set */}
        {lat != null && lng != null && (
          <div className="flex items-center gap-1 text-[9px] text-gray-400 shrink-0">
            <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            Ubicación seleccionada
          </div>
        )}
      </div>

      {/* ===== MAP MODAL ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

          {/* Modal panel */}
          <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "85vh", maxHeight: "600px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <span className="text-[13px] font-semibold text-gray-800">Selecciona tu ubicación</span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Search inside modal */}
            <div className="px-4 py-2 border-b border-gray-50 shrink-0">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input
                  type="text"
                  value={searchText}
                  onChange={handleSearchInput}
                  placeholder="Buscar dirección..."
                  className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[#1E293B] outline-none focus:border-primary focus:bg-white transition-all placeholder:text-[#94A3B8]"
                  autoFocus
                />
                {showResults && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {results.map((item, i) => (
                      <button key={i} type="button" onMouseDown={() => selectResult(item)}
                        className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-blue-50 hover:text-primary border-b border-gray-50 last:border-0"
                      >
                        <span className="line-clamp-2">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative min-h-0">
              <div ref={mapContainerRef} className="absolute inset-0" />
              {/* GPS button floating on map */}
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="absolute bottom-3 right-3 z-[1000] w-9 h-9 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-all disabled:opacity-50"
                title="Mi ubicación"
              >
                {gettingLocation ? (
                  <svg className="w-4 h-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
                ) : (
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
              <span className="text-[10px] text-gray-400">Arrastra el pin para ajustar la ubicación</span>
              <button
                type="button"
                onClick={confirmLocation}
                className="px-5 py-2 text-[12px] font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-all shadow-sm"
              >
                Confirmar ubicación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
