const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.businessSockets = new Map(); // businessId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173", // Vite dev server
          "https://servisbet-client-git-main-horlartundheys-projects.vercel.app",
          process.env.CLIENT_URL || "http://localhost:3000"
        ],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // User authentication and room joining
      socket.on('authenticate', (data) => {
        try {
          const { userId, userRole, businessIds } = data;
          
          // Store user connection
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          socket.userRole = userRole;

          // Join user to their personal room
          socket.join(`user:${userId}`);
          
          // If business user, join business rooms
          if (userRole === 'business' && businessIds?.length > 0) {
            businessIds.forEach(businessId => {
              socket.join(`business:${businessId}`);
              
              // Track business socket connections
              if (!this.businessSockets.has(businessId)) {
                this.businessSockets.set(businessId, new Set());
              }
              this.businessSockets.get(businessId).add(socket.id);
            });
          }

          // Join admin room if admin
          if (userRole === 'admin') {
            socket.join('admin');
          }

          console.log(`✅ User authenticated: ${userId} (${userRole})`);
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { error: error.message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        
        // Clean up user connections
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          
          // Clean up business socket connections
          this.businessSockets.forEach((sockets, businessId) => {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.businessSockets.delete(businessId);
            }
          });
        }
      });

      // Test notification endpoint
      socket.on('test_notification', (data) => {
        socket.emit('notification', {
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test notification',
          timestamp: new Date()
        });
      });
    });

    console.log('🚀 Socket.io service initialized');
    return this.io;
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    if (!this.io) return false;

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });

    console.log(`📢 Notification sent to user ${userId}:`, notification.title);
    return true;
  }

  // Send notification to business owners
  sendToBusiness(businessId, notification) {
    if (!this.io) return false;

    this.io.to(`business:${businessId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });

    console.log(`🏢 Notification sent to business ${businessId}:`, notification.title);
    return true;
  }

  // Send notification to all admins
  sendToAdmins(notification) {
    if (!this.io) return false;

    this.io.to('admin').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });

    console.log(`👮 Admin notification sent:`, notification.title);
    return true;
  }

  // Send new review notification to business
  sendNewReviewNotification(businessId, review, business) {
    return this.sendToBusiness(businessId, {
      type: 'new_review',
      title: 'New Review Received',
      message: `${review.isAnonymous ? review.anonymousReviewer.name : review.user.firstName} left a ${review.rating}-star review for ${business.name}`,
      data: {
        reviewId: review._id,
        businessId: businessId,
        rating: review.rating,
        reviewerName: review.isAnonymous ? review.anonymousReviewer.name : `${review.user.firstName} ${review.user.lastName}`
      },
      actions: [
        { label: 'View Review', action: 'view_review', data: { reviewId: review._id } },
        { label: 'Respond', action: 'respond_review', data: { reviewId: review._id } }
      ]
    });
  }

  // Send low rating alert to business
  sendLowRatingAlert(businessId, business, averageRating, review) {
    return this.sendToBusiness(businessId, {
      type: 'low_rating_alert',
      title: '⚠️ Low Rating Alert',
      message: `Your business rating dropped to ${averageRating} stars. Immediate attention recommended.`,
      priority: 'high',
      data: {
        businessId: businessId,
        businessName: business.name,
        averageRating: averageRating,
        latestReviewId: review._id
      },
      actions: [
        { label: 'View Dashboard', action: 'view_dashboard' },
        { label: 'Respond to Review', action: 'respond_review', data: { reviewId: review._id } }
      ]
    });
  }

  // Send review response notification to reviewer
  sendReviewResponseNotification(reviewId, review, businessResponse) {
    const targetUserId = review.isAnonymous ? null : review.user._id;
    
    if (!targetUserId) return false; // Can't notify anonymous reviewers via socket

    return this.sendToUser(targetUserId, {
      type: 'review_response',
      title: 'Business Responded to Your Review',
      message: `${review.business.name} responded to your review`,
      data: {
        reviewId: reviewId,
        businessName: review.business.name,
        responseContent: businessResponse.content.substring(0, 100) + (businessResponse.content.length > 100 ? '...' : '')
      },
      actions: [
        { label: 'View Response', action: 'view_review', data: { reviewId: reviewId } }
      ]
    });
  }

  // Send admin notification for flagged content
  sendAdminFlaggedContentAlert(review, flagReason) {
    return this.sendToAdmins({
      type: 'flagged_content',
      title: 'Review Flagged for Moderation',
      message: `A review has been flagged: ${flagReason}`,
      priority: 'medium',
      data: {
        reviewId: review._id,
        businessName: review.business?.name || 'Unknown Business',
        flagReason: flagReason,
        reviewerName: review.isAnonymous ? review.anonymReviewer?.name : `${review.user?.firstName} ${review.user?.lastName}`
      },
      actions: [
        { label: 'Moderate Review', action: 'moderate_review', data: { reviewId: review._id } }
      ]
    });
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.connectedUsers.size,
      businessConnections: this.businessSockets.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
      isActive: !!this.io
    };
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;