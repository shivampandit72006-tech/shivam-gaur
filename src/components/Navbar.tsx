import React from 'react';
import { ShoppingCart, User, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { cn } from '../lib/utils';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onProfileClick: () => void;
  onAdminClick: () => void;
  isAdmin: boolean;
}

export default function Navbar({ cartCount, onCartClick, onProfileClick, onAdminClick, isAdmin }: NavbarProps) {
  const [user] = useAuthState(auth);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-full px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight hidden sm:block text-white">Smackers</span>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onCartClick}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={onAdminClick}
                  className="bg-brand/10 hover:bg-brand/20 text-brand px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand/20 transition-all"
                >
                  Admin
                </button>
              )}
              <button 
                onClick={onProfileClick}
                className="flex items-center gap-2 hover:bg-white/10 p-1 pr-3 rounded-full transition-colors"
              >
                <img 
                  src={user.photoURL || ''} 
                  alt={user.displayName || ''} 
                  className="w-8 h-8 rounded-full border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold hidden md:block">{user.displayName?.split(' ')[0]}</span>
              </button>
              <button 
                onClick={logout}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
            >
              <User className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
