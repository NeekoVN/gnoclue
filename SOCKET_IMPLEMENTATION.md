# Socket.IO Implementation for Real-time Vote Updates

This document explains how Socket.IO has been implemented for live upvote/downvote updates in the frontend.

## Overview

The implementation provides real-time vote updates using Socket.IO, with optimistic updates for better user experience.

## Components

### 1. SocketContext (`src/app/contexts/SocketContext.tsx`)
- Manages Socket.IO connection lifecycle
- Automatically connects when user is authenticated
- Provides socket instance and connection status
- Handles authentication with JWT token

### 2. useVoteUpdates Hook (`src/app/hooks/useVoteUpdates.ts`)
- Listens for real-time vote updates from the server
- Handles vote errors
- Provides callback functions for vote updates

### 3. Optimistic Vote Utils (`src/app/utils/optimisticVote.ts`)
- Creates optimistic updates for immediate UI feedback
- Handles vote state management
- Provides rollback functionality on errors

## How It Works

### Connection Flow
1. User authenticates → SocketContext connects to server
2. Socket connection established with JWT token
3. Real-time listeners set up for vote events

### Vote Flow
1. User clicks upvote/downvote → Optimistic update applied immediately
2. Socket event emitted to server (`vote_cast`)
3. API call made to update database
4. Server broadcasts update to all connected clients
5. UI updates with real-time data

### Event Types

#### Client → Server
- `vote_cast`: Emitted when user votes
  ```javascript
  {
    postId: string,
    voteType: "upvote" | "downvote",
    userId: string
  }
  ```

#### Server → Client
- `vote_updated`: Vote update received
  ```javascript
  {
    postId: string,
    updatedPost: IPost
  }
  ```
- `vote_error`: Vote error received
  ```javascript
  {
    message: string
  }
  ```

## Usage

### In Components
```javascript
import { useSocket } from "../contexts/SocketContext";
import { useVoteUpdates } from "../hooks/useVoteUpdates";

const MyComponent = () => {
  const { socket, isConnected } = useSocket();
  
  const handleVoteUpdate = (postId, updatedPost) => {
    // Update local state
  };
  
  useVoteUpdates({ onVoteUpdate: handleVoteUpdate });
  
  // Use socket for emitting events
  socket?.emit("vote_cast", { postId, voteType, userId });
};
```

### Optimistic Updates
```javascript
import { createOptimisticVoteUpdate } from "../utils/optimisticVote";

const optimisticPost = createOptimisticVoteUpdate(post, "upvote", userId);
// Apply optimistic update immediately
onPostUpdate(optimisticPost);
```

## Backend Requirements

Your Socket.IO server should:

1. **Authenticate connections** using JWT tokens
2. **Listen for vote events**:
   ```javascript
   socket.on("vote_cast", async (data) => {
     // Process vote in database
     // Broadcast update to all clients
     io.emit("vote_updated", { postId: data.postId, updatedPost });
   });
   ```
3. **Handle errors** and emit `vote_error` events
4. **Broadcast updates** to all connected clients

## Development Features

- **Connection Status Indicator**: Shows real-time connection status in development
- **Error Handling**: Displays vote errors to users
- **Optimistic Updates**: Immediate UI feedback
- **Automatic Reconnection**: Handles connection drops

## Environment Variables

No additional environment variables needed - the Socket.IO client connects to `http://localhost:6996` by default.

## Testing

1. Start your Socket.IO server
2. Start the Next.js development server
3. Open multiple browser tabs
4. Vote on posts in one tab
5. Verify updates appear in real-time in other tabs

## Troubleshooting

- Check browser console for connection errors
- Verify Socket.IO server is running on correct port
- Ensure JWT token is valid
- Check network connectivity 