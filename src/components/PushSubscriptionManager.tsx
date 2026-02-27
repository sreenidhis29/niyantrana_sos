"use client";

import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushSubscriptionManager() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && vapidPublicKey) {
            navigator.serviceWorker.ready.then(async (registration) => {
                try {
                    let subscription = await registration.pushManager.getSubscription();

                    // If not subscribed, try to subscribe immediately if permission is already granted, 
                    // or just wait. It's often better to rely on user action to requestPermission,
                    // but since this is an emergency app, let's request it right away if possible
                    if (!subscription && Notification.permission !== 'denied') {
                        if (Notification.permission !== 'granted') {
                            await Notification.requestPermission();
                        }

                        if (Notification.permission === 'granted') {
                            subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                            });
                        }
                    }

                    if (subscription) {
                        // We use a simple hash or stringified subscription as ID, 
                        // but a quick btoa() of the endpoint works to ensure uniqueness per device.
                        const endpointHash = btoa(subscription.endpoint).replace(/[/+=]/g, '');
                        await setDoc(doc(db, 'push_subscriptions', endpointHash.substring(0, 50)), {
                            subscription: subscription.toJSON(),
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    }

                } catch (error) {
                    console.error("Error managing push subscription:", error);
                }
            });
        }
    }, []);

    return null;
}
