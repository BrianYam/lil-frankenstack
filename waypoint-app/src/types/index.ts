export * from './users.types';
export * from './auth.types';


export type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};
