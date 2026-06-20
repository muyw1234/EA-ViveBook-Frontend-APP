/**
 * Backend Endpoint Example for Firebase Cloud Messaging
 * Location: PUT /usuarios/push-token
 *
 * This is an example implementation for Node.js/Express
 * Adapt this to your backend framework
 */

// ============================================
// Express.js + Firebase Admin SDK Example
// ============================================

const admin = require('firebase-admin');
const express = require('express');
const router = express.Router();

// Initialize Firebase Admin SDK (do this once in your app.js)
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   projectId: 'ea-vivebook-frontend-web'
// });

/**
 * Store FCM Token for a user
 *
 * Request:
 * {
 *   "token": "FCM_TOKEN_STRING_HERE"
 * }
 */
router.put('/usuarios/push-token', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id; // Assuming you have authentication middleware

    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
      });
    }

    // Store token in your database
    // Example: MongoDB
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date(),
        },
      },
      { new: true },
    );

    console.log(`[FCM] Token stored for user ${userId}: ${token.substring(0, 20)}...`);

    return res.status(200).json({
      success: true,
      message: 'FCM token registered successfully',
    });
  } catch (error) {
    console.error('[FCM] Error storing token:', error);
    return res.status(500).json({
      error: 'Failed to store FCM token',
    });
  }
});

module.exports = router;

// ============================================
// Sending Notifications Example
// ============================================

async function sendNotificationToUser(userId, notificationData) {
  try {
    // 1. Get user's FCM token from database
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.log(`[FCM] No FCM token found for user ${userId}`);
      return;
    }

    // 2. Create the message
    const message = {
      data: {
        type: notificationData.type,
        ...notificationData, // Include additional data
      },
      token: user.fcmToken,
    };

    // 3. Send using Firebase Admin SDK
    const response = await admin.messaging().send(message);
    console.log(`[FCM] Successfully sent to ${userId}:`, response);
    return response;
  } catch (error) {
    console.error(`[FCM] Error sending notification to ${userId}:`, error);

    // If token is invalid, delete it
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/mismatched-registration-token'
    ) {
      await User.findByIdAndUpdate(userId, { fcmToken: null });
      console.log(`[FCM] Deleted invalid token for user ${userId}`);
    }
  }
}

// ============================================
// Usage Examples
// ============================================

// Example 1: User joined an event
async function notifyEventJoined(userId, eventId) {
  await sendNotificationToUser(userId, {
    type: 'event_joined',
    eventId: eventId,
    title: 'Event Joined',
    body: 'You have successfully joined the event!',
  });
}

// Example 2: User received a new rating
async function notifyNewRating(userId, rating) {
  await sendNotificationToUser(userId, {
    type: 'new_rating',
    title: 'New Rating',
    body: `You received a ${rating} star rating!`,
  });
}

// Example 3: User's book was favorited
async function notifyBookFavorited(userId, bookId) {
  await sendNotificationToUser(userId, {
    type: 'book_favorite',
    bookId: bookId,
    title: 'Book Favorited',
    body: 'Someone favorited your book!',
  });
}

// Example 4: User's book was rented
async function notifyBookRented(userId, bookId) {
  await sendNotificationToUser(userId, {
    type: 'book_rented',
    bookId: bookId,
    title: 'Book Rented',
    body: 'Your book has been rented!',
  });
}

// Example 5: New follower
async function notifyNewFollower(userId, followerId) {
  await sendNotificationToUser(userId, {
    type: 'new_follower',
    actorId: followerId,
    title: 'New Follower',
    body: 'Someone started following you!',
  });
}

// Example 6: User published new book
async function notifyUserNewBook(userId, bookId) {
  await sendNotificationToUser(userId, {
    type: 'user_new_book',
    bookId: bookId,
    title: 'New Book Available',
    body: 'A user you follow has published a new book!',
  });
}

// ============================================
// Send to Topic (Multiple Users)
// ============================================

/**
 * Subscribe user to a topic when they join
 * Topics allow you to send to many users at once
 */
async function subscribeUserToTopic(userId, topic) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) return;

    await admin.messaging().subscribeToTopic([user.fcmToken], topic);

    console.log(`[FCM] User ${userId} subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`[FCM] Error subscribing to topic:`, error);
  }
}

/**
 * Send notification to all users in a topic
 */
async function sendNotificationToTopic(topic, notificationData) {
  try {
    const message = {
      data: {
        ...notificationData,
      },
      topic: topic,
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM] Successfully sent to topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`[FCM] Error sending to topic ${topic}:`, error);
  }
}

// Example: Subscribe user when they join an event
async function handleUserJoinedEvent(userId, eventId) {
  // Send direct notification
  await notifyEventJoined(userId, eventId);

  // Subscribe to event topic for future updates
  await subscribeUserToTopic(userId, `event_${eventId}`);
}

// Example: Notify all members of an event
async function notifyEventMembers(eventId, message) {
  await sendNotificationToTopic(`event_${eventId}`, {
    type: 'event_update',
    eventId: eventId,
    title: 'Event Update',
    body: message,
  });
}

// ============================================
// Database Schema (MongoDB Example)
// ============================================

/*
User Schema should include:
{
  _id: ObjectId,
  email: String,
  name: String,
  fcmToken: String,           // ← Add this field
  fcmTokenUpdatedAt: Date,    // ← Optional: track when token was updated
  // ... other fields
}

Migration to add field:
db.users.updateMany({}, { $set: { fcmToken: null } })
*/

// ============================================
// Environment Variables
// ============================================

/*
Add to your .env file:

FIREBASE_PROJECT_ID=ea-vivebook-frontend-web
FIREBASE_PRIVATE_KEY=<your-private-key>
FIREBASE_CLIENT_EMAIL=<your-client-email>

Load in your app:
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};
*/

// ============================================
// Testing the Endpoint
// ============================================

/*
Test with curl:

// Get FCM token from your device logs first (look for "[FCM] ✅ Token nativo registrado")

curl -X PUT http://localhost:3000/usuarios/push-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "FCM_TOKEN_FROM_LOGS_HERE"
  }'

Expected response:
{
  "success": true,
  "message": "FCM token registered successfully"
}
*/
