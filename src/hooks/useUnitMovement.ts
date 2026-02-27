import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export interface UnitState {
    id: string;
    name: string;
    status: string;
    current_pos: { lat: number; lng: number } | null;
    target_pos: { lat: number; lng: number } | null;
}

/** Linear interpolation helper */
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const ANIMATION_DURATION_MS = 5000;

export const useUnitMovement = () => {
    const [units, setUnits] = useState<UnitState[]>([]);
    const animationRefs = useRef<Map<string, { startTime: number; from: { lat: number; lng: number }; to: { lat: number; lng: number }; rafId: number }>>(new Map());

    useEffect(() => {
        // If Firebase isn't configured, return empty state
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            return;
        }

        const q = query(collection(db, 'units'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.forEach((doc) => {
                const data = doc.data() as Omit<UnitState, 'id'>;
                const unitId = doc.id;

                setUnits((prev) => {
                    const existing = prev.find((u) => u.id === unitId);

                    // If the unit has a target_pos and it changed, start lerp animation
                    if (
                        data.target_pos &&
                        data.current_pos &&
                        data.status === 'dispatched' &&
                        (!existing || JSON.stringify(existing.target_pos) !== JSON.stringify(data.target_pos))
                    ) {
                        startLerpAnimation(unitId, data.current_pos, data.target_pos);
                    }

                    const updated = { id: unitId, ...data };
                    if (existing) {
                        return prev.map((u) => (u.id === unitId ? { ...u, ...updated } : u));
                    }
                    return [...prev, updated];
                });
            });
        });

        return () => {
            unsubscribe();
            // Cancel all ongoing animations on unmount
            animationRefs.current.forEach((anim) => cancelAnimationFrame(anim.rafId));
        };
    }, []);

    const startLerpAnimation = (
        unitId: string,
        from: { lat: number; lng: number },
        to: { lat: number; lng: number }
    ) => {
        // Cancel any existing animation for this unit
        const existing = animationRefs.current.get(unitId);
        if (existing) cancelAnimationFrame(existing.rafId);

        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

            const currentLat = lerp(from.lat, to.lat, t);
            const currentLng = lerp(from.lng, to.lng, t);

            setUnits((prev) =>
                prev.map((u) =>
                    u.id === unitId
                        ? { ...u, current_pos: { lat: currentLat, lng: currentLng } }
                        : u
                )
            );

            if (t < 1) {
                const rafId = requestAnimationFrame(animate);
                animationRefs.current.set(unitId, { startTime, from, to, rafId });
            } else {
                animationRefs.current.delete(unitId);
            }
        };

        const rafId = requestAnimationFrame(animate);
        animationRefs.current.set(unitId, { startTime, from, to, rafId });
    };

    return { units };
};
