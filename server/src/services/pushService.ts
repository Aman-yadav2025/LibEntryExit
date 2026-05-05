import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';

let vapidInitialised = false;

const initVapid = () => {
  if (vapidInitialised) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('⚠️  VAPID keys not set — push notifications disabled.');
    return;
  }
  webpush.setVapidDetails(
    'mailto:admin@setu.ie',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidInitialised = true;
};

export const sendPush = async (userId: string, title: string, body: string) => {
  initVapid();
  if (!vapidInitialised) return;

  try {
    const record = await PushSubscription.findOne({ user: userId });
    if (!record) return;

    await webpush.sendNotification(
      record.subscription as webpush.PushSubscription,
      JSON.stringify({ title, body })
    );
  } catch (err: any) {
    console.error('Push failed:', err.message);
    if (err.statusCode === 410) {
      await PushSubscription.deleteOne({ user: userId }).catch(() => {});
    }
  }
};

