"use client";
import dynamic from 'next/dynamic';
import React from 'react';
import { MapEngineProps } from './MapEngine';

const MapEngine = dynamic(() => import('./MapEngine'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center text-cyber-cyan font-mono text-sm tracking-widest bg-slate-950">
            LOADING SATELLITE FEED...
        </div>
    )
});

export const TacticalMap: React.FC<MapEngineProps> = ({ units = [], zones = [], center, onUnitDrop }) => {
    return (
        <div className="w-full h-full relative z-0">
            <MapEngine units={units} zones={zones} center={center} onUnitDrop={onUnitDrop} />
        </div>
    );
};
