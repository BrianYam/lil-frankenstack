import Link from 'next/link';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  alternateLink: {
    text: string;
    href: string;
    description: string;
  };
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  alternateLink
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-indigo-700">Waypoint</h1>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}{' '}
            <Link href={alternateLink.href} className="font-medium text-indigo-600 hover:text-indigo-500">
              {alternateLink.description}
            </Link>
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
}
