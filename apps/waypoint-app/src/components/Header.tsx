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
                  variant="indigo"
                  size="sm"
                >
                  <Link href="/signup">
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4 px-2 py-3">
              <Link
                href="/"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home size={16} />
                Home
              </Link>
              <Link
                href="/destinations"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Map size={16} />
                Destinations
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info size={16} />
                About
              </Link>
              
              {isAuthenticated && user ? (
                <>
                  <div className="py-2 border-t border-gray-100">
                    <Link 
                      href="/me" 
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={14} />
                      {user.email}
                    </Link>
                    <span className="text-xs text-gray-500 capitalize block pl-6 mt-1">{user.role}</span>
                  </div>
                  <Button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="text-indigo-700 justify-start pl-0"
                    size="sm"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-3 pt-2 border-t border-gray-100">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-indigo-700 justify-start pl-0"
                    size="sm"
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
                    variant="indigo"
                    size="sm"
                  >
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}
