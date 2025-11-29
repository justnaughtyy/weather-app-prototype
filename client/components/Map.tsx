"use client"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Icon Setup (เหมือนเดิม)
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const customIcon = L.icon({
    iconUrl: iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function FlyToLocation({ coords }: { coords: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 10, { // 10 คือระดับ Zoom
                duration: 1.5 // บินช้าๆ นุ่มๆ 1.5 วินาที
            }); 
        }
    }, [coords, map]);
    return null;
}

function MapEvents({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
    useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng); } });
    return null;
}

export default function Map({ selectedPos, onLocationSelect }: any) {
    const { resolvedTheme } = useTheme(); // เช็คว่าเป็น dark หรือ light
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    // เลือก URL แผนที่ตาม Theme
    // Light: OpenStreetMap ปกติ
    // Dark: CartoDB Dark Matter (ฟรีและสวยมากสำหรับ Dark mode)
    const tileLayerUrl = resolvedTheme === 'dark' 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = resolvedTheme === 'dark'
        ? '&copy; OpenStreetMap &copy; CartoDB'
        : '&copy; OpenStreetMap contributors';

    return (
        <MapContainer key={`${resolvedTheme || 'light'}-map`} center={[13.7563, 100.5018]} zoom={6} className="h-full w-full z-0 bg-zinc-100 dark:bg-zinc-900">
            <TileLayer attribution={attribution} url={tileLayerUrl} />
            <MapEvents onSelect={onLocationSelect} />
            <FlyToLocation coords={selectedPos} />
            {selectedPos && <Marker position={selectedPos} icon={customIcon} />}
        </MapContainer>
    );
}