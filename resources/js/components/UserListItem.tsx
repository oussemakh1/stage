import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
    id: number;
    name: string;
    email: string | null;
    bio?: string | null;
    created_at: string;
    has_pending_request: boolean;
    has_received_request: boolean;
}

interface UserListItemProps {
    user: User;
    isCurrentUser: boolean;
    isFriend: boolean;
    isSending: boolean;
    onSendRequest: (userId: number) => void;
}

export default function UserListItem({
    user,
    isCurrentUser,
    isFriend,
    isSending,
    onSendRequest
}: UserListItemProps) {
    return (
        <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg truncate" title={user.name}>{user.name}</CardTitle>
                        <CardDescription className="mt-1">
                            Member since {new Date(user.created_at).toLocaleDateString()}
                        </CardDescription>
                    </div>
                    {isFriend && <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Friend</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
                {/* Bio/Email hidden if not friends (handled by API returning null) */}
                {user.bio && isFriend && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {user.bio}
                    </p>
                )}

                {!isCurrentUser && (
                    <Button
                        onClick={() => onSendRequest(user.id)}
                        disabled={isFriend || isSending || user.has_pending_request || user.has_received_request}
                        variant={isFriend || user.has_pending_request || user.has_received_request ? "secondary" : "default"}
                        className="w-full mt-auto"
                    >
                        {isSending
                            ? 'Sending...'
                            : isFriend
                                ? 'Already Friends'
                                : user.has_pending_request
                                    ? 'Request Sent'
                                    : user.has_received_request
                                        ? 'Request Received'
                                        : 'Send Friend Request'
                        }
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
