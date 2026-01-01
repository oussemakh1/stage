import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import UserListItem from '../components/UserListItem';

interface User {
    id: number;
    name: string;
    email: string | null; // Email might be hidden
    bio?: string | null; // Bio might be hidden
    created_at: string;
    has_pending_request: boolean;
    has_received_request: boolean;
}

export default function Users() {
    const { user: currentUser, token } = useAuth();
    const { friends, sendFriendRequest } = useFriends();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingRequests, setSendingRequests] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (userId: number) => {
        setSendingRequests(prev => new Set(prev).add(userId));

        try {
            await sendFriendRequest(userId);
            // Optimistically update the UI to show request sent
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.id === userId ? { ...u, has_pending_request: true } : u
                )
            );
        } catch (error) {
            console.error('Failed to send friend request:', error);
        } finally {
            setSendingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const isFriend = (userId: number) => {
        return friends.some(friend => friend.id === userId);
    };

    const isCurrentUser = (userId: number) => {
        return currentUser?.id === userId;
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );



    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-xl">Loading users...</div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <Head title="Users" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Browse Users</h1>
                        <Input
                            type="text"
                            placeholder="Search users by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredUsers.map(user => (
                            <UserListItem
                                key={user.id}
                                user={user}
                                isCurrentUser={isCurrentUser(user.id)}
                                isFriend={isFriend(user.id)}
                                isSending={sendingRequests.has(user.id)}
                                onSendRequest={handleSendRequest}
                            />
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                            No users found matching your search.
                        </div>
                    )}

                    <div className="mt-8 flex space-x-4">
                        <Button asChild variant="outline">
                            <Link href="/profile">Back to Profile</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/friends">My Friends</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
