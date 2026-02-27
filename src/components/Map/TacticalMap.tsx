"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import MapEngine to avoid Leaflet SSR layout issues (window not defined)
const MapEngine = dynamic(() => import('./MapEngine'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-cyber-cyan font-mono text-sm tracking-widest bg-slate-950">LOADING SATELLITE FEED...</div>
});

export const TacticalMap: React.FC = () => {
    return (
        <div className="w-full h-full relative z-0">
            <MapEngine />
        </div>
    );
};
