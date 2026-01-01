import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ProfileCard from '../components/ProfileCard';
import EditBioModal from '../components/EditBioModal';

export default function Profile() {
    const { user, token, updateUser, logout } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleUpdateProfile = async (data: { name: string; email: string; bio: string }) => {
        if (!token) return;

        const response = await fetch('/api/profile/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const updatedData = await response.json();

        if (response.ok) {
            updateUser(updatedData);
        } else {
            throw new Error(updatedData.message || 'Failed to update profile');
        }
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    if (!user) return null; // Or loading state

    return (
        <ProtectedRoute>
            <Head title="Profile" />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    <ProfileCard
                        user={user}
                        isCurrentUser={true}
                        onEdit={() => setIsEditModalOpen(true)}
                    />

                    <EditBioModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        currentUser={{
                            name: user.name,
                            email: user.email || '',
                            bio: user.bio || ''
                        }}
                        onUpdate={handleUpdateProfile}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Account Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                Logout
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex space-x-4">
                        <Button asChild>
                            <Link href="/users">Browse Users</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/friends">My Friends</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

