"use client";
import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { HUDLayout, ThemeColor } from '@/components/HUD/HUDLayout';
import { TacticalMap } from '@/components/Map/TacticalMap';
import { UnitSidebar, TacticalUnit, MissionLog } from '@/components/HUD/UnitSidebar';
import { MapUnit, MapZone } from '@/components/Map/MapEngine';

interface MissionData {
    id: string;
    title: string;
    description: string;
    themeColor: ThemeColor;
    center: [number, number];
}

const MISSIONS: MissionData[] = [
    { id: 'alpha', title: 'INCIDENT ALPHA: FIRE', description: 'Major structural fire in commercial zone. High risk of spread.', themeColor: 'rose', center: [13.0118, 77.5552] },
    { id: 'beta', title: 'INCIDENT BETA: FLOOD', description: 'Flash flooding reported in low-lying areas. Evacuation required.', themeColor: 'blue', center: [11.7480, 79.7714] },
    { id: 'gamma', title: 'INCIDENT GAMMA: AVIATION', description: 'Aviation emergency. Aircraft off runway. Mass casualty potential.', themeColor: 'amber', center: [11.1367, 75.9553] }
];

function TacticalDashboardContent() {
    const searchParams = useSearchParams();
    const missionId = searchParams.get('mission');

    const [selectedMission, setSelectedMission] = useState<MissionData | null>(null);
    const [sidebarUnits, setSidebarUnits] = useState<TacticalUnit[]>([]);
    const [dispatchedMapUnits, setDispatchedMapUnits] = useState<MapUnit[]>([]);
    const [mapZones, setMapZones] = useState<MapZone[]>([]);
    const [logs, setLogs] = useState<MissionLog[]>([]);

    useEffect(() => {
        const mission = MISSIONS.find(m => m.id === missionId) || MISSIONS[0];
        setSelectedMission(mission);

        // Initialize units
        setSidebarUnits([
            { id: 'u1', name: 'Fire-Ladder', type: 'rescue', status: 'idle' },
            { id: 'u2', name: 'Rescue-Boat', type: 'rescue', status: 'idle' },
            { id: 'u3', name: 'Med-Response', type: 'medical', status: 'idle' }
        ]);

        setDispatchedMapUnits([]);
        setMapZones([
            { id: 'z1', lat: mission.center[0], lng: mission.center[1], radius: 1000, type: 'Quarantine', color: mission.themeColor === 'rose' ? '#f43f5e' : mission.themeColor === 'blue' ? '#3b82f6' : '#f59e0b' }
        ]);

        setLogs([
            { id: 'init', timestamp: new Date(), message: `UPLINK ESTABLISHED. TRACKING ${mission.title}.`, type: 'info' }
        ]);
    }, [missionId]);

    const handleUnitDrop = useCallback(
        async (unitData: { id: string; name: string; type: string }, lat: number, lng: number) => {
            setSidebarUnits((prev) =>
                prev.map((u) => u.id === unitData.id ? { ...u, status: 'dispatched' } : u)
            );

            setDispatchedMapUnits((prev) => {
                const exists = prev.find((u) => u.id === unitData.id);
                if (exists) {
                    return prev.map((u) => u.id === unitData.id ? { ...u, lat, lng, status: 'dispatched' } : u);
                }
                return [...prev, { id: unitData.id, name: unitData.name, lat, lng, type: unitData.type, status: 'dispatched' }];
            });

            setLogs((prev) => [
                ...prev,
                { id: `log-${Date.now()}`, timestamp: new Date(), message: `UNIT DISPATCHED: ${unitData.name} -> LAT: ${lat.toFixed(4)}, LNG: ${lng.toFixed(4)}`, type: 'warning' }
            ]);

            if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                try {
                    await setDoc(doc(db, 'units', unitData.id), {
                        name: unitData.name,
                        status: 'dispatched',
                        target_pos: { lat, lng },
                        timestamp: serverTimestamp(),
                    }, { merge: true });
                } catch (err) {
                    console.error('Firestore dispatch error:', err);
                }
            }
        },
        []
    );

    if (!selectedMission) return <div className="h-full w-full bg-slate-950 flex items-center justify-center text-cyber-cyan">INITIALIZING COMMAND LINK...</div>;

    return (
        <HUDLayout themeColor={selectedMission.themeColor}>
            <div className="w-full h-full flex pt-24 pb-16 px-6 gap-6 relative z-10 pointer-events-auto">
                <div className={`flex-[7] h-full relative border bg-slate-950 shadow-2xl
                    ${selectedMission.themeColor === 'rose' ? 'border-rose-500/30' : ''}
                    ${selectedMission.themeColor === 'blue' ? 'border-blue-500/30' : ''}
                    ${selectedMission.themeColor === 'amber' ? 'border-amber-500/30' : ''}
                    `}
                >
                    <TacticalMap
                        units={dispatchedMapUnits}
                        zones={mapZones}
                        center={selectedMission.center}
                        onUnitDrop={handleUnitDrop}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-4 z-20">
                        <div className="text-white/20 text-xs font-mono tracking-widest uppercase">
                            Drop Unit Here to Dispatch
                        </div>
                    </div>
                </div>

                <div className="flex-[3] h-full relative shadow-2xl">
                    <UnitSidebar
                        units={sidebarUnits}
                        logs={logs}
                        themeColor={selectedMission.themeColor}
                    />
                </div>
            </div>
        </HUDLayout>
    );
}

export default function TacticalPage() {
    return (
        <Suspense fallback={<div className="h-full w-full bg-slate-950 flex items-center justify-center text-cyber-cyan">SYNCHRONIZING SATELLITE...</div>}>
            <TacticalDashboardContent />
        </Suspense>
    );
}
