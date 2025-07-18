import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { LoginFormRequest, loginSchema, SignupFormRequest, signupSchema } from '@/lib/schemas';
import { AuthFormType } from "@/types";
import { FcGoogle } from "react-icons/fc";

interface AuthFormProps {
  formType: AuthFormType;
  onSubmit: (data: { email: string; password: string; confirmPassword?: string }) => void;
  onGoogleAuth: () => void;
  isLoading: boolean;
  error: { message: string } | null;
  formError: string;
}


export function AuthForm({ 
  formType, 
  onSubmit, 
  onGoogleAuth, 
  isLoading, 
  error,
  formError
}: Readonly<AuthFormProps>) {
  const isSignup = formType === AuthFormType.SIGNUP;
  const buttonText = isSignup ? 'Create account' : 'Sign in';
  const loadingText = isSignup ? 'Creating account...' : 'Signing in...';
  
  return (
    <Card className="w-full max-w-md py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-blue-100 backdrop-blur-sm bg-white">
      {(error || formError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium shadow-sm">
          {formError || (error ? error.message : 'An error occurred')}
        </div>
      )}
      
      {isSignup ? (
        <SignupFormContent 
          onSubmit={onSubmit} 
          isLoading={isLoading}
          loadingText={loadingText}
          buttonText={buttonText}
        />
      ) : (
        <LoginFormContent 
          onSubmit={onSubmit} 
          isLoading={isLoading}
          loadingText={loadingText}
          buttonText={buttonText}
        />
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-blue-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 py-0.5 text-gray-500 rounded-full border border-blue-100 shadow-sm">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={onGoogleAuth}
            variant="outline"
            className="w-full inline-flex justify-center border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 shadow-sm transition-all duration-200 bg-white"
          >
            <FcGoogle className="h-5 w-5 mr-2" />
            Sign {isSignup ? 'up' : 'in'} with Google
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface FormContentProps {
  onSubmit: (data: LoginFormRequest | SignupFormRequest) => void;
  isLoading: boolean;
  loadingText: string;
  buttonText: string;
}

function LoginFormContent({
  onSubmit,
  isLoading,
  loadingText,
  buttonText
}: Readonly<FormContentProps>) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormRequest>({
    resolver: zodResolver(loginSchema),
  });
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">
          Email address
        </label>
        <div>
          <Input
            id="email"
            autoComplete="email"
            className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-indigo-700 mb-1">
          Password
        </label>
        <div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-blue-300 text-indigo-600 focus:ring-indigo-500 bg-white"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 hover:text-gray-800">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            Forgot your password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        variant="default"
        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg"
      >
        {isLoading ? loadingText : buttonText}
      </Button>
    </form>
  );
}

function SignupFormContent({
  onSubmit,
  isLoading,
  loadingText,
  buttonText
}: Readonly<FormContentProps>) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<SignupFormRequest>({
    resolver: zodResolver(signupSchema),
  });
  
  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-indigo-700 mb-1">
          Email address
        </label>
        <div>
          <Input
            id="email"
            autoComplete="email"
            className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-indigo-700 mb-1">
          Password
        </label>
        <div>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-700 mb-1">
          Confirm Password
        </label>
        <div>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            className="border-blue-200 bg-white hover:border-blue-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        variant="default"
        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all duration-200 hover:shadow-lg"
      >
        {isLoading ? loadingText : buttonText}
      </Button>
    </form>
  );
}
