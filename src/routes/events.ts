import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../models';
import { eventService } from '../services/eventService';
import { eventRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Get email queue status
 * GET /api/v1/events/email-queue/status
 */
router.get('/events/email-queue/status', eventRateLimiter, authenticateToken, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const status = eventService.getQueueStatus();
    
    res.status(200).json({
      success: true,
      message: 'Email queue status retrieved successfully',
      data: {
        ...status,
        isHealthy: status.failedJobs === 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting email queue status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get email queue status',
        statusCode: 500,
      },
    });
  }
});

/**
 * Clear completed email jobs
 * POST /api/v1/events/email-queue/clear-completed
 */
router.post('/events/email-queue/clear-completed', eventRateLimiter, authenticateToken, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    eventService.clearCompletedJobs();
    
    res.status(200).json({
      success: true,
      message: 'Completed email jobs cleared successfully',
      data: {
        clearedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error clearing completed email jobs:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to clear completed email jobs',
        statusCode: 500,
      },
    });
  }
});

/**
 * Test event emission
 * POST /api/v1/events/test
 */
router.post('/events/test', eventRateLimiter, authenticateToken, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Event type is required',
          statusCode: 400,
        },
      });
    }

    // Emit test event
    eventService.emit(eventType, data || {});
    
    res.status(200).json({
      success: true,
      message: `Test event '${eventType}' emitted successfully`,
      data: {
        eventType,
        data: data || {},
        emittedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error emitting test event:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to emit test event',
        statusCode: 500,
      },
    });
  }
});

export default router;
