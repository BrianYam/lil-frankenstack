import React, { useCallback, useState } from 'react';
import { UserDetails, UpdateUserDetailsRequest } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserDetails } from '@/hooks';
import { useToast } from '../ui/use-toast';
import { userDetailsFormSchema, UserDetailsFormRequest } from '@/lib/schemas';
import { Pencil } from 'lucide-react';

interface EditUserDetailsDialogProps {
  userDetails: UserDetails;
  onOpenChange: (open: boolean) => void;
}

export const EditUserDetailsDialog: React.FC<EditUserDetailsDialogProps> = ({
                                                                              userDetails,
                                                                              onOpenChange,
                                                                            }) => {
  const [open, setOpen] = useState(false); // Internal state for dialog
  const { updateUserDetailsMutation } = useUserDetails();
  const updateUserDetails = updateUserDetailsMutation.mutate;
  const isUpdatingUserDetails = updateUserDetailsMutation.isPending;
  const { toast } = useToast();

  const form = useForm<UserDetailsFormRequest>({
    resolver: zodResolver(userDetailsFormSchema),
    defaultValues: {
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      addressLine1: userDetails.addressLine1,
      addressLine2: userDetails.addressLine2 ?? '',
      city: userDetails.city,
      state: userDetails.state,
      postalCode: userDetails.postalCode,
      country: userDetails.country,
      mobileNumber: userDetails.mobileNumber,
    },
  });

  const onSubmit = useCallback(
    (values: UserDetailsFormRequest) => {
      const updateRequest: UpdateUserDetailsRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 ?? null,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
        mobileNumber: values.mobileNumber,
      };

      updateUserDetails(
        { id: userDetails.id, userDetailsData: updateRequest },
        {
          onSuccess: () => {
            toast({ title: 'Success', description: 'User details updated.' });
            setOpen(false); // Close the dialog
          },
          onError: (error) => {
            toast({
              title: 'Error',
              description: `Failed to update user details: ${error.message}`,
            });
            console.error('Failed to update user details:', error);
          },
        },
      );
    },
    [updateUserDetails, userDetails.id, toast],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-indigo-600 hover:text-indigo-700"
        >
          <Pencil size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader className="text-black">
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Make changes to your user details here. Click save when you&#39;re
            done.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4 text-gray-700"
        >
          {Object.keys(userDetailsFormSchema.shape).map((key) => {
            const fieldName = key as keyof UserDetailsFormRequest;
            return (
              <div
                key={fieldName}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label htmlFor={fieldName} className="text-right">
                  {fieldName
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </Label>
                <Controller
                  name={fieldName}
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id={fieldName}
                      className="col-span-3 border border-gray-300 "
                      {...field}
                      value={field.value ?? ''} // Ensure controlled component
                    />
                  )}
                />
                {form.formState.errors[fieldName] && (
                  <p className="col-span-4 text-right text-sm text-red-500">
                    {form.formState.errors[fieldName]?.message}
                  </p>
                )}
              </div>
            );
          })}
          <Button
            type="submit"
            disabled={isUpdatingUserDetails}
            variant="indigo"
          >
            {isUpdatingUserDetails ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
