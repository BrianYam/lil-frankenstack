import React, { useCallback } from 'react';
import { UserDetails } from '@/types';
import { useUserDetails } from '@/hooks';
import { useToast } from '../ui/use-toast';
import { UserDetailsCard } from './UserDetailsCard';
import { CreateUserDetailsDialog } from './CreateUserDetailsDialog';

interface UserDetailsListProps {
  details?: UserDetails[];
  defaultDetails?: UserDetails;
}

export const UserDetailsList: React.FC<UserDetailsListProps> = ({
  details,
  defaultDetails,
}) => {
  const { setDefaultUserDetails } = useUserDetails();
  const { toast } = useToast();

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultUserDetails(id, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Default user details updated.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: `Failed to set default user details: ${error.message}`,
          });
          console.error('Failed to set default user details:', error);
        },
      });
    },
    [setDefaultUserDetails, toast],
  );

  const otherDetails = details?.filter(
    (detail) => !defaultDetails || detail.id !== defaultDetails.id,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CreateUserDetailsDialog />
      </div>
      {defaultDetails && (
        <UserDetailsCard detail={defaultDetails} isDefault={true} />
      )}

      {otherDetails && otherDetails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Other Details</h3>
          {otherDetails.map((detail) => (
            <UserDetailsCard
              key={detail.id}
              detail={detail}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {!defaultDetails && (!otherDetails || otherDetails.length === 0) && (
        <div className="text-center p-8 bg-blue-50 rounded-lg text-gray-600">
          No user details available.
        </div>
      )}
    </div>
  );
};
