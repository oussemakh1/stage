import { Head, Link } from '@inertiajs/react';
import { useFriends } from '../contexts/FriendsContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import FriendRequestCard from '../components/FriendRequestCard';
import UserListItem from '../components/UserListItem';

export default function Friends() {
    const {
        friendRequests,
        friends,
        loading,
        acceptFriendRequest,
        rejectFriendRequest
    } = useFriends();



    return (
        <ProtectedRoute>
            <Head title="Friends" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Friend Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Friend Requests</CardTitle>
                            <CardDescription>
                                Manage incoming friend requests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {friendRequests.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No pending friend requests.</p>
                            ) : (
                                <div className="space-y-4">
                                    {friendRequests.map(request => (
                                        <FriendRequestCard
                                            key={request.id}
                                            request={request}
                                            onAccept={acceptFriendRequest}
                                            onReject={rejectFriendRequest}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Friends List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Friends</CardTitle>
                            <CardDescription>
                                People you're connected with
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {friends.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No friends yet. Start by browsing users!</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {friends.map(friend => (
                                        <UserListItem
                                            key={friend.id}
                                            user={{ ...friend, has_pending_request: false, has_received_request: false, created_at: friend.created_at || new Date().toISOString() }}
                                            isCurrentUser={false}
                                            isFriend={true}
                                            isSending={false}
                                            onSendRequest={() => { }}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex space-x-4">
                        <Button asChild variant="outline">
                            <Link href="/profile">Back to Profile</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/users">Browse Users</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
