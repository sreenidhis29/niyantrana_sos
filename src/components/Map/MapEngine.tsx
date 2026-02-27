"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useIncidents } from '@/hooks/useIncidents';

const MapEngine: React.FC = () => {
    const { incidents, loading } = useIncidents();
    // Default to New Delhi coordinates
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
        </MapContainer>
    );
};

export default MapEngine;
