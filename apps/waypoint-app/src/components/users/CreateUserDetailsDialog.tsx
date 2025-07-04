import React, { useCallback, useState } from 'react';
import { CreateUserDetailsRequest } from '@/types/users.types';
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
import { createUserDetailsFormSchema, CreateUserDetailsFormRequest } from '@/lib/schemas';
import { PlusCircle } from 'lucide-react';

interface CreateUserDetailsDialogProps {
  onOpenChange?: (open: boolean) => void;
}

export const CreateUserDetailsDialog: React.FC<CreateUserDetailsDialogProps> = ({
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false); // Internal state for dialog
  const { createUserDetails, isCreatingUserDetails } = useUserDetails();
  const { toast } = useToast();

  const form = useForm<CreateUserDetailsFormRequest>({
    resolver: zodResolver(createUserDetailsFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      mobileNumber: '',
    },
  });

  const onSubmit = useCallback(
    (values: CreateUserDetailsFormRequest) => {
      const createRequest: CreateUserDetailsRequest = {
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

      createUserDetails(
        createRequest,
        {
          onSuccess: () => {
            toast({ title: 'Success', description: 'User details created.' });
            setOpen(false); // Close the dialog
            form.reset(); // Reset form fields
          },
          onError: (error) => {
            toast({ title: 'Error', description: `Failed to create user details: ${error.message}` });
            console.error('Failed to create user details:', error);
          },
        }
      );
    },
    [createUserDetails, toast, form]
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { setOpen(newOpen); onOpenChange?.(newOpen); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 bg-white">
          <PlusCircle size={16} />
          Add New User Details
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader className="text-black">
          <DialogTitle>Create New User Details</DialogTitle>
          <DialogDescription>
            Fill in the details for the new user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 text-gray-700">
          {Object.keys(createUserDetailsFormSchema.shape).map((key) => {
            const fieldName = key as keyof CreateUserDetailsFormRequest;
            return (
              <div key={fieldName} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={fieldName} className="text-right">
                  {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
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
          <Button type="submit" disabled={isCreatingUserDetails} variant="indigo">
            {isCreatingUserDetails ? 'Creating...' : 'Create User Details'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
