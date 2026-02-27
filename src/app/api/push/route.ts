import { NextResponse } from 'next/server';
import webPush from 'web-push';

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
        const { subscription, data } = await req.json();

        if (!publicVapidKey || !privateVapidKey) {
            console.warn("VAPID keys not configured. Sending mock offline response instead of real push notification.");
            return NextResponse.json({ success: true, message: "Mock Notification sent (no VAPID keys)" });
        }

        await webPush.sendNotification(subscription, JSON.stringify(data));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
