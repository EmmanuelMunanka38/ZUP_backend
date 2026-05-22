import { Router, Response } from 'express';
import prisma from '../db/prisma';
import auth, { AuthRequest } from '../middleware/auth';
import role from '../middleware/role';

const router = Router();

router.get('/requests', auth, role('driver'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await prisma.deliveryRequest.findMany({
      where: { status: 'available' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

router.post('/requests/:id/accept', auth, role('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deliveryRequest = await prisma.deliveryRequest.findUnique({
      where: { id: req.params.id as string },
    });

    if (!deliveryRequest) {
      res.status(404).json({ success: false, message: 'Delivery request not found' });
      return;
    }

    if (deliveryRequest.status !== 'available') {
      res.status(400).json({ success: false, message: 'This delivery is no longer available' });
      return;
    }

    const updated = await prisma.deliveryRequest.update({
      where: { id: req.params.id as string },
      data: { status: 'accepted', driverId: req.userId },
    });

    await prisma.order.update({
      where: { id: deliveryRequest.orderId },
      data: { riderId: req.userId, status: 'preparing' },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept delivery' });
  }
});

router.get('/active', auth, role('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activeRequest = await prisma.deliveryRequest.findFirst({
      where: { driverId: req.userId, status: 'accepted' },
    });

    res.json({ success: true, data: activeRequest || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active delivery' });
  }
});

router.get('/dashboard', auth, role('driver'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = await prisma.deliveryRequest.findMany({
      where: {
        driverId: req.userId,
        status: 'completed',
        createdAt: { gte: today },
      },
    });

    const todayOrders = todayDeliveries.length;
    const dailyRevenue = todayDeliveries.reduce((sum: number, d: any) => sum + d.deliveryFee, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayDeliveries = await prisma.deliveryRequest.findMany({
      where: {
        driverId: req.userId,
        status: 'completed',
        createdAt: { gte: yesterday, lt: today },
      },
    });

    const yesterdayOrders = yesterdayDeliveries.length;
    const yesterdayRevenue = yesterdayDeliveries.reduce((sum: number, d: any) => sum + d.deliveryFee, 0);

    const totalOrders = await prisma.deliveryRequest.count({
      where: { driverId: req.userId, status: 'completed' },
    });

    const totalRevenueResult = await prisma.deliveryRequest.aggregate({
      where: { driverId: req.userId, status: 'completed' },
      _sum: { deliveryFee: true },
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        dailyRevenue,
        orderGrowth: yesterdayOrders > 0
          ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100)
          : todayOrders > 0 ? 100 : 0,
        revenueGrowth: yesterdayRevenue > 0
          ? Math.round(((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
          : dailyRevenue > 0 ? 100 : 0,
        totalOrders,
        totalRevenue: totalRevenueResult._sum.deliveryFee || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

export default router;
