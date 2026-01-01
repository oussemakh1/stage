import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types'; // Assuming types might ideally be shared, but I'll define locally if needed or assume standard
import { Pencil } from 'lucide-react'; // Using icon if available, or text

interface ProfileCardProps {
    user: {
        id: number;
        name: string;
        email: string;
        bio?: string | null;
        created_at: string; // or Date
    };
    isCurrentUser: boolean;
    onEdit?: () => void;
}

export default function ProfileCard({ user, isCurrentUser, onEdit }: ProfileCardProps) {
    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
                    <CardDescription>
                        {user.email}
                    </CardDescription>
                </div>
                {isCurrentUser && onEdit && (
                    <Button onClick={onEdit} variant="outline" size="sm" className="hidden sm:flex">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                    <h4 className="mb-2 text-sm font-medium leading-none text-muted-foreground">About</h4>
                    {user.bio ? (
                        <p className="text-sm">{user.bio}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No bio provided just yet.</p>
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                </div>

                {isCurrentUser && onEdit && (
                    <Button onClick={onEdit} variant="outline" size="sm" className="w-full sm:hidden">
                        Edit Profile
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
