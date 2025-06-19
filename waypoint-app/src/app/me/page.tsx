'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/user-context';
import { Spinner } from '@/components/ui/spinner';
import { Container } from '@/components/ui/container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/users.types';
import { LockKeyhole, UserCog, Users, Settings, Activity } from 'lucide-react';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useUserContext(); // Get user state from context
  const router = useRouter();
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 py-12">
      <Container className="py-8">
        <Card className="max-w-4xl mx-auto shadow-lg border border-blue-100">
          <CardHeader className="bg-white border-b border-blue-100">
            <CardTitle className="text-3xl text-indigo-700">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="bg-white pt-6">
            {user ? (
              <div className="space-y-8">
                <div className="border-b border-blue-100 pb-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Account Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-indigo-600 font-medium mb-1">Email Address</p>
                      <p className="text-lg font-medium text-gray-800">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-600 font-medium mb-1">User Role</p>
                      <p className="text-lg font-medium text-gray-800 capitalize">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                          {user.role || 'user'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              
              <div className="border-b border-blue-100 pb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Account Settings</h2>
                {showChangePassword ? (
                  <div className="mb-6">
                    <ChangePasswordForm 
                      onSuccess={() => {
                        setShowChangePassword(false);
                      }}
                      onCancel={() => setShowChangePassword(false)}
                    />
                  </div>
                ) : (
                  <div className="space-x-4">
                    <Button 
                      onClick={() => setShowChangePassword(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-white"
                    >
                      <LockKeyhole size={16} />
                      Change Password
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-white"
                    >
                      <UserCog size={16} />
                      Update Profile
                    </Button>
                  </div>
                )}
              </div>
              
              {user.role === UserRole.ADMIN && (
                <div className="border-b border-blue-100 pb-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Administration</h2>
                  <div className="space-x-4">
                    <Button 
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Users size={16} />
                      Manage Users
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Settings size={16} />
                      System Settings
                    </Button>
                  </div>
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-600" />
                  Account Activity
                </h2>
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                  <p className="text-gray-700 mb-2">Account created: <span className="font-medium text-indigo-700">June 10, 2025</span></p>
                  <p className="text-gray-700">Last login: <span className="font-medium text-indigo-700">Today</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-blue-50 rounded-lg">
              <p className="text-indigo-600">User information not available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  </div>
  );
}
