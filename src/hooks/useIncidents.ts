import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export interface Incident {
    id: string;
    type: string;
    lat: number;
    lng: number;
    radius: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    description: string;
}

export const useIncidents = () => {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // For MVp/Scaffolding: if Firebase isn't fully configured, we'll provide mock data
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            console.warn("Firebase not configured. Using mock incident data for scaffolding.");
            setTimeout(() => {
                setIncidents([
                    { id: '1', type: 'flood', lat: 28.6139, lng: 77.2090, radius: 500, severity: 'critical', timestamp: new Date().toISOString(), description: 'Major Flash Flood' },
                    { id: '2', type: 'fire', lat: 28.5355, lng: 77.2410, radius: 300, severity: 'high', timestamp: new Date().toISOString(), description: 'Industrial Fire' }
                ]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const q = query(collection(db, 'incidents'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const incidentsData: Incident[] = [];
                snapshot.forEach((doc) => {
                    incidentsData.push({ id: doc.id, ...doc.data() } as Incident);
                });
                setIncidents(incidentsData);
                setLoading(false);
            }, (err) => {
                console.error("Firestore listener error:", err);
                setError(err as Error);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error setting up Firestore listener:", err);
            setError(err as Error);
            setLoading(false);
        }
    }, []);

    return { incidents, loading, error };
};
