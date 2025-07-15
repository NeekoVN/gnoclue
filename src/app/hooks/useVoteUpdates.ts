import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { IPost } from "../types/post";

interface UseVoteUpdatesProps {
  onVoteUpdate?: (postId: string, updatedPost: IPost) => void;
  onVoteError?: (error: string) => void;
}

export const useVoteUpdates = ({ onVoteUpdate, onVoteError }: UseVoteUpdatesProps = {}) => {
  const { socket, isConnected } = useSocket();
  const lastVoteTime = useRef<number>(0);

  const handleVoteUpdate = useCallback(
    (data: unknown) => {
      console.log("Received vote update:", data);
      
      // Handle different data structures
      let postId: string;
      let updatedPost: IPost;
      
      if (typeof data === 'object' && data !== null) {
        const dataObj = data as Record<string, unknown>;
        
        if (dataObj.postId && dataObj.updatedPost) {
          // Standard format
          postId = dataObj.postId as string;
          updatedPost = dataObj.updatedPost as IPost;
        } else if (dataObj._id) {
          // Direct post object
          postId = dataObj._id as string;
          updatedPost = dataObj as unknown as IPost;
        } else if (dataObj.postId && (dataObj.upvotes !== undefined || dataObj.downvotes !== undefined)) {
          // Vote count update format
          postId = dataObj.postId as string;
          console.log("Received vote count update:", dataObj);
          
          // We need to get the existing post from the parent component
          // For now, we'll create a minimal post update
          const voteUpdate = {
            postId: dataObj.postId as string,
            upvotes: dataObj.upvotes as number,
            downvotes: dataObj.downvotes as number,
            netVotes: dataObj.netVotes as number,
            timestamp: dataObj.timestamp as string,
          };
          
          // Create a minimal post object for the update
          const minimalPost: IPost = {
            _id: postId,
            userId: "unknown", // This will be replaced by the existing post
            content: "", // This will be replaced by the existing post
            createdAt: new Date().toISOString(),
            updatedAt: voteUpdate.timestamp,
            upvotes: Array(voteUpdate.upvotes).fill("user_id"),
            downvotes: Array(voteUpdate.downvotes).fill("user_id"),
            tags: [],
            images: [],
            commentCount: 0,
          };
          
          updatedPost = minimalPost;
        } else {
          console.error("Invalid vote update data structure:", data);
          return;
        }
      } else {
        console.error("Invalid vote update data:", data);
        return;
      }
      
      console.log("Processed vote update:", { postId, updatedPost });
      lastVoteTime.current = Date.now();
      onVoteUpdate?.(postId, updatedPost);
    },
    [onVoteUpdate]
  );

  const handleVoteError = useCallback(
    (error: { message: string }) => {
      console.error("Vote error:", error);
      onVoteError?.(error.message);
    },
    [onVoteError]
  );

  // Fallback polling mechanism
  useEffect(() => {
    if (!isConnected) return;

    const pollInterval = setInterval(() => {
      // Poll for updates every 5 seconds if no socket events received in last 10 seconds
      const timeSinceLastVote = Date.now() - lastVoteTime.current;
      if (timeSinceLastVote > 10000) {
        console.log("No recent socket events, polling for updates...");
        // You could implement a polling mechanism here if needed
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isConnected]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.log("Socket not ready for vote updates:", { socket: !!socket, isConnected });
      return;
    }

    console.log("Setting up vote update listeners");

    // Listen for vote updates
    socket.on("vote_updated", (data) => {
      console.log("Received vote_updated event:", data);
      handleVoteUpdate(data);
    });
    
    // Listen for post updates (in case the backend sends general post updates)
    socket.on("post_updated", (data) => {
      console.log("Received post_updated event:", data);
      handleVoteUpdate(data);
    });

    // Listen for any custom vote events your backend might be sending
    socket.on("vote_cast", (data) => {
      console.log("Received vote_cast event:", data);
      handleVoteUpdate(data);
    });

    // Listen for general post updates
    socket.on("post_update", (data) => {
      console.log("Received post_update event:", data);
      handleVoteUpdate(data);
    });
    
    // Listen for vote errors
    socket.on("vote_error", (error) => {
      console.log("Received vote_error event:", error);
      handleVoteError(error);
    });

    return () => {
      console.log("Cleaning up vote update listeners");
      socket.off("vote_updated", handleVoteUpdate);
      socket.off("post_updated", handleVoteUpdate);
      socket.off("vote_cast", handleVoteUpdate);
      socket.off("post_update", handleVoteUpdate);
      socket.off("vote_error", handleVoteError);
    };
  }, [socket, isConnected, handleVoteUpdate, handleVoteError]);

  return {
    isConnected,
  };
}; 