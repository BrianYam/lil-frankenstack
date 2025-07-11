'use client';
export * from './use-auth';
export * from './use-users';
export * from './use-user-details';

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
