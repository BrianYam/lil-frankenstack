'use client';

import Link from 'next/link';
import { useUserContext } from '@/contexts/user-context';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Menu, X, User, LogOut, Home, Map, Info } from 'lucide-react';
import { useAuth } from "@/hooks";

export function Header() {
  const { user, isAuthenticated } = useUserContext();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-indigo-700">Waypoint</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link href="/destinations" className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Map size={16} />
              <span>Destinations</span>
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Info size={16} />
              <span>About</span>
            </Link>
          </nav>

          {/* Auth Buttons or User Info */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <Link href="/me" className="text-sm font-medium text-gray-900 hover:text-indigo-600 flex items-center">
                    <User size={14} className="mr-1" />
                    {user.email}
                  </Link>
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                </div>
                <Button
                  onClick={() => logout()}
                  variant="ghost"
                  className="text-indigo-700"
                  size="sm"
                >
                  <LogOut size={14} className="mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-indigo-700"
                  size="sm"
                >
                  <Link href="/login">
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Link href="/signup">
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {isAuthenticated && user && (
              <div className="flex items-center mr-2">
                <div className="bg-indigo-100 rounded-full p-1 flex-shrink-0">
                  <User size={16} className="text-indigo-700" />
                </div>
                <span className="text-xs font-medium text-indigo-700 ml-1 max-w-[80px] truncate">
                  {user.email.split('@')[0]}
                </span>
              </div>
            )}
            <Button
              onClick={toggleMenu}
              variant="ghost"
              size="icon"
              className="text-gray-700 hover:text-indigo-600"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu with smooth transition */}
        <div 
          className={`md:hidden absolute left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden px-4 ${
            isMenuOpen 
              ? 'max-h-[500px] opacity-100' 
              : 'max-h-0 opacity-0 py-0'
          }`}
        >
          <div className="py-3">
            {/* Navigation Links */}
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-indigo-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home size={18} />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href="/destinations"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-indigo-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Map size={18} />
                <span className="font-medium">Destinations</span>
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2 p-2 rounded-md hover:bg-indigo-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info size={18} />
                <span className="font-medium">About</span>
              </Link>
            </nav>

            {/* User Account Section */}
            {isAuthenticated && user ? (
              <div className="py-3 border-t border-gray-200 mt-2">
                <div className="bg-indigo-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
                      <User size={20} className="text-indigo-700" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-medium text-indigo-900 truncate">{user.email}</h4>
                      <span className="text-xs text-indigo-600 capitalize block">{user.role}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Link 
                    href="/me" 
                    className="text-sm font-medium bg-white border border-indigo-100 rounded-md py-2 px-3 text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} />
                    View Profile
                  </Link>
                  
                  <Button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="text-rose-600 border border-rose-100 hover:bg-rose-50 justify-center"
                    size="sm"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 py-3 border-t border-gray-200 mt-2">
                <div className="text-center text-sm text-gray-600 mb-1">
                  Join Waypoint to start planning your adventure
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="text-indigo-700 bg-blue-300 border-indigo-200 hover:bg-indigo-50 justify-center"
                  size="default"
                >
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="default"
                >
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
