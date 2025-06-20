'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/user-context';
import { LockKeyhole, Users, Settings, Activity, User as UserIcon, Mail, Shield, CalendarDays, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UserRole } from '@/types/users.types';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useUserContext();
  const router = useRouter();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
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
  
  const renderAccountInfo = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-center h-24 w-24 rounded-full bg-indigo-100 border-2 border-indigo-200 text-indigo-700 shadow-sm">
          <UserIcon size={40} strokeWidth={1.5} />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-2xl font-semibold text-gray-800">{user?.email}</h3>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Shield size={14} className="mr-1" />
            <span className="capitalize">{user?.role} Account</span>
          </div>
          <p className="text-gray-500 mt-1">Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-blue-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-5 border-b border-blue-100">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Mail size={18} className="text-indigo-600" />
              Email Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-lg font-medium text-gray-800 break-all">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-1">Your email is used for logging in and account recovery</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4 px-5 border-b border-blue-100">
            <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
              <Shield size={18} className="text-indigo-600" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-lg font-medium text-gray-800 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === UserRole.ADMIN 
                ? 'Administrators have full access to all features' 
                : user?.role === UserRole.EDITOR 
                  ? 'Editors can create and manage content' 
                  : 'Standard users have basic access'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-lg mb-6">
        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          <LockKeyhole size={18} className="text-indigo-600" />
          Password Management
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          It&apos;s recommended to use a strong password that you don&apos;t use elsewhere and to change it periodically.
        </p>
        {showChangePassword ? (
          <div className="mt-4 p-5 bg-white rounded-lg border border-blue-100 shadow-sm">
            <ChangePasswordForm 
              onSuccess={() => {
                setShowChangePassword(false);
              }}
              onCancel={() => setShowChangePassword(false)}
            />
          </div>
        ) : (
          <Button 
            onClick={() => setShowChangePassword(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 bg-white transition-all"
          >
            <LockKeyhole size={16} />
            Change Password
          </Button>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Activity size={18} className="text-indigo-600" />
          Account Activity
        </h3>
        <div className="space-y-3 mt-3">
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <CalendarDays size={18} className="text-indigo-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Account Created</p>
              <p className="text-sm text-gray-600">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <Clock size={18} className="text-indigo-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Last Login</p>
              <p className="text-sm text-gray-600">{user?.updatedAt ? new Date(user.updatedAt).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short'
              }) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg">
        <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-indigo-600" />
          Administrative Tools
        </h3>
        <p className="text-indigo-700 mb-6">
          As an administrator, you have access to the following system management tools:
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="default"
            size="default"
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 h-auto py-3"
            onClick={() => router.push('/admin/users')}
          >
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="block font-medium">User Management</span>
              <span className="text-xs text-indigo-200">Manage user accounts & permissions</span>
            </div>
          </Button>
          
          <Button 
            variant="default"
            size="default"
            className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 h-auto py-3"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <Settings size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="block font-medium">System Settings</span>
              <span className="text-xs text-indigo-200">Configure system preferences</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 py-12">
      <Container className="py-8">
        <Card className="max-w-4xl mx-auto shadow-lg border border-blue-100">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 pb-6">
            <CardTitle className="text-3xl text-white flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <UserIcon size={24} className="text-white" />
              </div>
              Your Profile
            </CardTitle>
            <p className="text-indigo-100 mt-1">Manage your account settings and preferences</p>
          </CardHeader>
          
          <div className="bg-white border-b border-blue-100">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'account' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-300'
                }`}
              >
                <UserIcon size={16} />
                Account Information
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'settings' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-300'
                }`}
              >
                <Settings size={16} />
                Settings
              </button>
              {user?.role === UserRole.ADMIN && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'admin' 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-300'
                  }`}
                >
                  <Shield size={16} />
                  Administration
                </button>
              )}
            </div>
          </div>
          
          <CardContent className="bg-white p-6">
            {user ? (
              <div className="py-2">
                {activeTab === 'account' && renderAccountInfo()}
                {activeTab === 'settings' && renderSettings()}
                {activeTab === 'admin' && user.role === UserRole.ADMIN && renderAdmin()}
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
