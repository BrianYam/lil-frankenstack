'use client';

import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from "@/types";
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole, UserCog, Users, Settings, Activity } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <Container className="py-12">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-gray-900">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="text-lg font-medium text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">User Role</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {user.role || 'user'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
                <div className="space-x-4">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LockKeyhole size={16} />
                    Change Password
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserCog size={16} />
                    Update Profile
                  </Button>
                </div>
              </div>
              
              {user.role === UserRole.ADMIN && (
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Administration</h2>
                  <div className="space-x-4">
                    <Button 
                      variant="indigo"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Users size={16} />
                      Manage Users
                    </Button>
                    <Button 
                      variant="indigo"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Settings size={16} />
                      System Settings
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity size={20} />
                  Account Activity
                </h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-600">Account created: <span className="font-medium">June 10, 2025</span></p>
                  <p className="text-gray-600">Last login: <span className="font-medium">Today</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">User information not available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
