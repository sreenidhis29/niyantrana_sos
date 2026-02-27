import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

export async function POST(req: Request) {
    if (publicVapidKey && privateVapidKey) {
        webPush.setVapidDetails(
            'mailto:test@example.com',
            publicVapidKey,
            privateVapidKey
        );
    }
    try {
        const data = await req.json();

        if (!publicVapidKey || !privateVapidKey) {
            console.warn("VAPID keys not configured. Simulating broadcast push...");
            return NextResponse.json({ success: true, message: "Mock Broadcast complete" });
        }

        const subscriptionsSnapshot = await getDocs(collection(db, 'push_subscriptions'));
        const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data().subscription);

        let sentCount = 0;
        let errors = 0;

        for (const sub of subscriptions) {
            try {
                await webPush.sendNotification(sub, JSON.stringify(data));
                sentCount++;
            } catch (err) {
                console.error('Failed to send to one subscription', err);
                errors++;
            }
        }

        return NextResponse.json({ success: true, sent: sentCount, errors: errors });
    } catch (error) {
        console.error('Error broadcasting push notification:', error);
        return NextResponse.json({ error: 'Failed to broadcast notification' }, { status: 500 });
    }
}
