"use client";
import React, { useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidents } from '@/hooks/useIncidents';

// Fix typical Leaflet icon issues in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const dispatchedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export interface MapUnit {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: string;
    status?: string;
}

export interface MapZone {
    id: string;
    lat: number;
    lng: number;
    radius: number;
    type: string;
    color?: string;
}

export interface MapEngineProps {
    units?: MapUnit[];
    zones?: MapZone[];
    center?: [number, number];
    onUnitDrop?: (unitData: { id: string; name: string; type: string }, lat: number, lng: number) => void;
}

/** Inner component that allows dynamic map movement */
const MapUpdater: React.FC<{ center?: [number, number] }> = ({ center }) => {
    const map = useMap();
    React.useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom(), { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

/** Inner component that has access to the Leaflet map instance via useMap() */
const DropHandler: React.FC<{ onUnitDrop: MapEngineProps['onUnitDrop'] }> = ({ onUnitDrop }) => {
    const map = useMap();

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        const raw = e.dataTransfer?.getData('application/json');
        if (!raw || !onUnitDrop) return;

        try {
            const unitData = JSON.parse(raw);

            // Accuracy Fix: Calculate container point from client coordinates relative to map container
            const rect = map.getContainer().getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const latlng = map.containerPointToLatLng(L.point(x, y));
            onUnitDrop(unitData, latlng.lat, latlng.lng);
        } catch (err) {
            console.error('Drop error:', err);
        }
    }, [map, onUnitDrop]);

    React.useEffect(() => {
        const container = map.getContainer();
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        return () => {
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('drop', handleDrop);
        };
    }, [map, handleDrop]);

    return null;
};

const MapEngine: React.FC<MapEngineProps> = ({ units = [], zones = [], center, onUnitDrop }) => {
    const { incidents, loading } = useIncidents();
    const defaultCenter = [28.6139, 77.2090] as [number, number];

    if (loading) return <div className="h-full w-full flex items-center justify-center text-cyber-cyan font-mono text-sm tracking-widest bg-slate-950">INITIALIZING CARTOGRAPHY...</div>;

    return (
        <MapContainer
            center={defaultCenter}
            zoom={12}
            className="w-full h-full"
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; <a href='https://carto.com/'>CARTO</a>"
            />

            {/* Component to update map center dynamically */}
            <MapUpdater center={center} />

            {/* Drop handler to calculate lat/lng on unit drop */}
            {onUnitDrop && <DropHandler onUnitDrop={onUnitDrop} />}

            {/* Real-time incidents from Firebase */}
            {incidents.map((incident) => (
                <CircleMarker
                    key={incident.id}
                    center={[incident.lat, incident.lng]}
                    radius={incident.severity === 'critical' ? 20 : 10}
                    pathOptions={{
                        color: incident.severity === 'critical' || incident.severity === 'high' ? '#f43f5e' : '#22d3ee',
                        fillColor: incident.severity === 'critical' || incident.severity === 'high' ? '#f43f5e' : '#22d3ee',
                        fillOpacity: 0.4,
                        className: 'animate-radar-pulse'
                    }}
                >
                    <Popup>
                        <div className="bg-slate-900 text-cyber-cyan p-2 font-mono text-xs border border-cyber-cyan">
                            <h3 className="font-bold text-alert-rose uppercase">{incident.type} ALERT</h3>
                            <p className="opacity-90">{incident.description}</p>
                            <p className="mt-1 opacity-70">Radius: {incident.radius}m</p>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}

            {/* Custom Zones from Props */}
            {zones.map((zone) => (
                <Circle
                    key={`zone-${zone.id}`}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                        color: zone.color || '#22d3ee',
                        fillColor: zone.color || '#22d3ee',
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '4, 6'
                    }}
                >
                    <Popup>
                        <div className="bg-slate-900 text-cyber-cyan p-2 font-mono text-xs border border-cyber-cyan">
                            <h3 className="font-bold uppercase tracking-widest">{zone.type} ZONE</h3>
                            <p>Radius: {zone.radius}m</p>
                        </div>
                    </Popup>
                </Circle>
            ))}

            {/* Tactical Units */}
            {units.map((unit) => (
                <Marker
                    key={`unit-${unit.id}`}
                    position={[unit.lat, unit.lng]}
                    icon={unit.status === 'dispatched' ? dispatchedIcon : customIcon}
                >
                    <Popup>
                        <div className="bg-slate-900 text-cyber-cyan p-2 font-mono text-xs border border-cyber-cyan">
                            <h3 className="font-bold uppercase">{unit.name}</h3>
                            <p className="opacity-70">Type: {unit.type}</p>
                            {unit.status && <p className={`text-xs font-bold uppercase mt-1 ${unit.status === 'dispatched' ? 'text-alert-rose' : 'text-cyber-cyan'}`}>{unit.status.replace('_', ' ')}</p>}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapEngine;
