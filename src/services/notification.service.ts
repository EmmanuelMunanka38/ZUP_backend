import prisma from '../db/prisma';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

export const createNotification = async (payload: NotificationPayload): Promise<void> => {
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    },
  });
};

export const sendPushNotification = async (userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true },
  });

  if (user?.fcmToken) {
    // FCM push send stub - integrate with firebase-admin when ready
    console.log(`[PUSH] Would send to ${user.fcmToken}: ${title} - ${body}`);
  }

  await createNotification({ userId, title, body, data });
};

export const getNotifications = async (userId: string, limit = 20, offset = 0) => {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, total, limit, offset };
};

export const markNotificationRead = async (notificationId: string, userId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
};
