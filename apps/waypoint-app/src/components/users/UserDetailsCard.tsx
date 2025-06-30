import React, { useCallback, useState } from 'react';
import { UserDetails } from '@/types/users.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useUserDetails } from '@/hooks/use-user-details';
import { useToast } from '../ui/use-toast';
import { EditUserDetailsDialog } from './EditUserDetailsDialog'; // Import from its new location

interface UserDetailsCardProps {
  detail: UserDetails;
  isDefault?: boolean;
  onSetDefault?: (id: string) => void;
}

export const UserDetailsCard: React.FC<UserDetailsCardProps> = ({
  detail,
  isDefault = false,
  onSetDefault,
}) => {
  const { deleteUserDetails, isDeletingUserDetails, isSettingDefaultUserDetails } = useUserDetails();
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = useCallback(
    (id: string) => {
      deleteUserDetails(id, {
        onSuccess: () => {
          toast({ title: 'Success', description: 'User details deleted.' });
        },
        onError: (error) => {
          toast({ title: 'Error', description: `Failed to delete user details: ${error.message}` });
          console.error('Failed to delete user details:', error);
        },
      });
    },
    [deleteUserDetails, toast]
  );

  return (
    <Card className={isDefault ? "border border-indigo-200 shadow-md bg-indigo-50" : "border border-blue-100 shadow-sm"}>
      <CardHeader className={isDefault ? "bg-indigo-100 py-4 px-5 border-b border-indigo-200 flex flex-row items-center justify-between" : "bg-blue-50 py-3 px-4 border-b border-blue-100 flex flex-row items-center justify-between"}>
        <CardTitle className={isDefault ? "text-lg text-indigo-800 flex items-center gap-2" : "text-md text-gray-700 flex items-center gap-2"}>
          {isDefault && <Star size={20} className="text-indigo-600 fill-indigo-600" />}
          <MapPin size={isDefault ? 20 : 16} className={isDefault ? "text-indigo-600" : "text-blue-600"} />
          {detail.firstName} {detail.lastName}
        </CardTitle>
        <div className="flex items-center gap-2">
          {!isDefault && onSetDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-400 border-blue-400 text-gray-700 hover:bg-blue-200 hover:border-blue-200" 
                  disabled={isSettingDefaultUserDetails}
                >
                  Set Default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Set Default</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to set these user details as default?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onSetDefault && onSetDefault(detail.id)}
                    disabled={isSettingDefaultUserDetails}
                  >
                    {isSettingDefaultUserDetails ? 'Setting...' : 'Set Default'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <EditUserDetailsDialog
            userDetails={detail}
            onOpenChange={setIsEditDialogOpen}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete these user
                  details.
                  {isDefault && <span className="mt-2 text-rose-500 font-medium">This action cannot be undone.</span>}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(detail.id)}
                  disabled={isDeletingUserDetails}
                >
                  {isDeletingUserDetails ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className={isDefault ? "p-5 space-y-3" : "p-4 space-y-2 text-sm"}>
        <div className={isDefault ? "flex items-center gap-2 text-gray-700" : "flex items-center gap-2 text-gray-600"}>
          <MapPin size={isDefault ? 16 : 14} className={isDefault ? "text-indigo-500" : "text-blue-500"} />
          <span>
            {detail.addressLine1}, {detail.city}, {detail.state} {detail.postalCode},{' '}
            {detail.country}
          </span>
        </div>
        {detail.addressLine2 && (
          <div className={isDefault ? "flex items-center gap-2 text-gray-700" : "flex items-center gap-2 text-gray-600"}>
            <MapPin size={isDefault ? 16 : 14} className={isDefault ? "text-indigo-500" : "text-blue-500"} />
            <span>{detail.addressLine2}</span>
          </div>
        )}
        <div className={isDefault ? "flex items-center gap-2 text-gray-700" : "flex items-center gap-2 text-gray-600"}>
          <Phone size={isDefault ? 16 : 14} className={isDefault ? "text-indigo-500" : "text-blue-500"} />
          <span>{detail.mobileNumber}</span>
        </div>
        {isDefault && (
          <div className="flex items-center gap-2 text-gray-700">
            <Mail size={16} className="text-indigo-500" />
            <span>
              {detail.firstName} {detail.lastName}
            </span>
          </div>
        )}
      </CardContent>
      {isEditDialogOpen && (
        <EditUserDetailsDialog
          userDetails={detail}
          onOpenChange={(open: boolean) => {
            setIsEditDialogOpen(open);
          }}
        />
      )}
    </Card>
  );
};
