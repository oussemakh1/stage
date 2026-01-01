import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FriendRequest {
    id: number;
    sender: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
}

interface FriendRequestCardProps {
    request: FriendRequest;
    onAccept: (id: number) => void;
    onReject: (id: number) => void;
}

export default function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
    return (
        <Card className="mb-4">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-lg">{request.sender.name}</h3>
                    <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Received {new Date(request.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => onAccept(request.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Accept
                    </Button>
                    <Button
                        onClick={() => onReject(request.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                        Reject
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
