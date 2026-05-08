import { Queue, Worker, Job } from 'bullmq';
import config from '@/config';
import prisma from '@/db/prisma';
import { sendPushNotification } from '@/services/notification.service';

const connection = { url: config.redis.url };

// --- Queues ---

export const notificationQueue = new Queue('notifications', { connection });
export const orderQueue = new Queue('orders', { connection });

// --- Workers ---

const notificationWorker = new Worker('notifications', async (job: Job) => {
  const { type, userId, title, body, data } = job.data;

  switch (type) {
    case 'push':
      await sendPushNotification(userId, title, body, data);
      break;
    case 'order_status':
      await sendPushNotification(userId, title, body, { ...data, type: 'order_status' });
      break;
    default:
      console.log(`[Queue] Unknown notification type: ${type}`);
  }
}, { connection });

const orderWorker = new Worker('orders', async (job: Job) => {
  const { type, orderId } = job.data;

  switch (type) {
    case 'assign_driver':
      // Stub: auto-assign driver logic
      console.log(`[Queue] Auto-assigning driver for order ${orderId}`);
      break;
    case 'timeout_cancel':
      // Cancel order if not confirmed within X minutes
      try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === 'pending') {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
          });
          await sendPushNotification(order.userId, 'Order Cancelled', 'Your order was cancelled due to no confirmation.');
        }
      } catch (error) {
        console.error(`[Queue] Timeout cancel error for ${orderId}:`, error);
      }
      break;
    default:
      console.log(`[Queue] Unknown order job type: ${type}`);
  }
}, { connection });

notificationWorker.on('completed', (job) => {
  console.log(`[Queue] Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Queue] Notification job ${job?.id} failed:`, err);
});

orderWorker.on('completed', (job) => {
  console.log(`[Queue] Order job ${job.id} completed`);
});

orderWorker.on('failed', (job, err) => {
  console.error(`[Queue] Order job ${job?.id} failed:`, err);
});

// --- Helper functions ---

export const scheduleOrderTimeout = async (orderId: string, delayMs = 15 * 60 * 1000): Promise<void> => {
  await orderQueue.add('timeout_cancel', { type: 'timeout_cancel', orderId }, { delay: delayMs });
};

export const sendNotification = async (userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> => {
  await notificationQueue.add('push', { type: 'push', userId, title, body, data });
};

export const closeQueues = async (): Promise<void> => {
  await notificationQueue.close();
  await orderQueue.close();
  await notificationWorker.close();
  await orderWorker.close();
};
