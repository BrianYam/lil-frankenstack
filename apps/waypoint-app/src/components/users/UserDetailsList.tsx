import React from 'react';
import { UserDetails } from '@/types/users.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MapPin, Phone, Star } from 'lucide-react';

interface UserDetailsListProps {
  details?: UserDetails[];
  defaultDetails?: UserDetails;
}

export const UserDetailsList: React.FC<UserDetailsListProps> = ({ details, defaultDetails }) => {
  const otherDetails = details?.filter(
    (detail) => !defaultDetails || detail.id !== defaultDetails.id
  );

  return (
    <div className="space-y-6">
      {defaultDetails && (
        <Card className="border border-indigo-200 shadow-md bg-indigo-50">
          <CardHeader className="bg-indigo-100 py-4 px-5 border-b border-indigo-200 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-indigo-800 flex items-center gap-2">
              <Star size={20} className="text-indigo-600 fill-indigo-600" />
              Default Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={16} className="text-indigo-500" />
              <span>
                {defaultDetails.addressLine1}, {defaultDetails.city}, {defaultDetails.state}{' '}
                {defaultDetails.postalCode}, {defaultDetails.country}
              </span>
            </div>
            {defaultDetails.addressLine2 && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={16} className="text-indigo-500" />
                <span>{defaultDetails.addressLine2}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={16} className="text-indigo-500" />
              <span>{defaultDetails.mobileNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={16} className="text-indigo-500" />
              <span>
                {defaultDetails.firstName} {defaultDetails.lastName}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {otherDetails && otherDetails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Other Details</h3>
          {otherDetails.map((detail) => (
            <Card key={detail.id} className="border border-blue-100 shadow-sm">
              <CardHeader className="bg-blue-50 py-3 px-4 border-b border-blue-100">
                <CardTitle className="text-md text-gray-700 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  {detail.firstName} {detail.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-blue-500" />
                  <span>
                    {detail.addressLine1}, {detail.city}, {detail.state} {detail.postalCode},{' '}
                    {detail.country}
                  </span>
                </div>
                {detail.addressLine2 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-blue-500" />
                    <span>{detail.addressLine2}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-blue-500" />
                  <span>{detail.mobileNumber}</span>
                </div>
              </CardContent>
            </Card>
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
