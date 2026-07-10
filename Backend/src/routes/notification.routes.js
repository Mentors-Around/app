// src/routes/notification.routes.js
import { Router }      from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getNotifications, getUnreadCount, markAsRead,
  markAllAsRead, deleteNotification, clearAllNotifications,
} from '../controllers/notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/',                        getNotifications);
router.get('/unread-count',            getUnreadCount);
router.patch('/read-all',              markAllAsRead);
router.delete('/',                     clearAllNotifications);
router.patch('/:id/read',              markAsRead);
router.delete('/:id',                  deleteNotification);

export default router;