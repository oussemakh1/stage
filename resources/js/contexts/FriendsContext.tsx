import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
}

interface Friend {
  id: number;
  name: string;
  email: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

interface FriendsContextType {
  friendRequests: FriendRequest[];
  friends: Friend[];
  loading: boolean;
  error: string | null;
  fetchFriendRequests: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (userId: number) => Promise<void>;
  acceptFriendRequest: (requestId: number) => Promise<void>;
  rejectFriendRequest: (requestId: number) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

interface FriendsProviderProps {
  children: ReactNode;
}

export const FriendsProvider: React.FC<FriendsProviderProps> = ({ children }) => {
  const { token } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const fetchFriendRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/friends/requests');
      setFriendRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friend requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/friends');
      setFriends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/friends/request/${userId}`, {
        method: 'POST',
      });
      // Refresh friend requests after sending
      await fetchFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/friends/accept/${requestId}`, {
        method: 'POST',
      });
      // Refresh both requests and friends
      await fetchFriendRequests();
      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (requestId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/api/friends/reject/${requestId}`, {
        method: 'POST',
      });
      // Refresh requests
      await fetchFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriendRequests();
      fetchFriends();
    }
  }, [token]);

  const value = {
    friendRequests,
    friends,
    loading,
    error,
    fetchFriendRequests,
    fetchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
};
