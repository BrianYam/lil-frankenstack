'use client';
import { WaypointApiServices } from '@/services';

export * from './use-auth';
export * from './use-users';
export * from './use-user-details';

// Export API services for use in hooks
export const apiServices = {
  auth: WaypointApiServices.getAuthService(),
  users: WaypointApiServices.getUsersService(),
  userDetails: WaypointApiServices.getUserDetailsService(),
};

export const queryKeys = {
  users: {
    currentUser: ['currentUser'],
    all: ['users'],
  },
  userDetails: {
    all: ['allUserDetails'],
    default: ['defaultUserDetails'],
    byId: (id: string) => ['userDetails', id],
  },
};

