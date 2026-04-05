import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Star, MapPin, Info, ChevronRight, Plus, Minus, Utensils } from 'lucide-react';
import { Restaurant, MenuItem, OrderItem } from '../types';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

interface RestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMenu: (id: string) => void;
  onAddToCart: (item: MenuItem, restaurantId?: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  cartItems: OrderItem[];
}

export default function RestaurantModal({ 
  restaurant, 
  isOpen, 
  onClose, 
  onSelectMenu,
  onAddToCart,
  onUpdateQuantity,
  cartItems
}: RestaurantModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, restaurant?.id]);

  useEffect(() => {
    if (restaurant && isOpen) {
      setLoading(true);
      const menuPath = `restaurants/${restaurant.id}/menu`;
      const q = query(collection(db, menuPath));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(data);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, menuPath);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [restaurant, isOpen]);

  if (!restaurant) return null;

  const handleViewMenu = () => {
    onSelectMenu(restaurant.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl h-full md:h-auto md:max-h-[85vh] bg-surface md:border border-white/10 rounded-none md:rounded-[2.5rem] z-[110] overflow-hidden flex flex-col shadow-2xl"
          >
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              <div className="relative h-64 md:h-80 overflow-hidden bg-black/40">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
                  referrerPolicy="no-referrer"
                />
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="relative w-full h-full object-contain z-10"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-20" />
                
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur-md hover:bg-black/70 rounded-full text-white transition-all border border-white/10 z-30"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="absolute bottom-6 left-8 right-8 z-30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand/20">
                      {restaurant.cuisine}
                    </span>
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {restaurant.rating}
                    </div>
                    {restaurant.estimatedDeliveryTime && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-brand/20 text-brand text-[10px] font-bold rounded-full border border-brand/20">
                        <Clock className="w-3 h-3" />
                        {restaurant.estimatedDeliveryTime}
                      </div>
                    )}
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">{restaurant.name}</h2>
                </div>
              </div>

              <div className="p-8 md:p-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand">
                    <Info className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">About the Restaurant</h3>
                  </div>
                  <p className="text-white/70 leading-relaxed text-lg">
                    {restaurant.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand">
                      <Clock className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Operating Hours</h3>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-white/90 font-medium">
                        {restaurant.operatingHours || 'Mon-Sun: 10:00 AM - 10:00 PM'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-brand">
                      <MapPin className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Location</h3>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-white/90 font-medium">
                        123 Smackers St, Food District
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand">
                      <Utensils className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Popular Items</h3>
                    </div>
                    <button 
                      onClick={handleViewMenu}
                      className="text-xs font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-1"
                    >
                      See Full Menu
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="py-10 text-center text-white/30 italic text-sm">Loading menu...</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {menuItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center group hover:bg-white/10 transition-all">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 bg-black/20">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40"
                              referrerPolicy="no-referrer"
                            />
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="relative w-full h-full object-contain z-10"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">{item.name}</h4>
                            <p className="text-brand font-bold text-sm">${item.price.toFixed(2)}</p>
                          </div>
                          
                          {cartItems.find(i => i.id === item.id) ? (
                            <div className="flex items-center gap-3 bg-black/20 rounded-lg px-2 py-1 border border-white/10">
                              <button 
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="p-1 hover:text-brand transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-4 text-center text-white">
                                {cartItems.find(i => i.id === item.id)?.quantity}
                              </span>
                              <button 
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="p-1 hover:text-brand transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => onAddToCart(item, restaurant.id)}
                              className="bg-brand hover:bg-brand-dark p-2 rounded-lg transition-colors shadow-lg shadow-brand/20 text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {menuItems.length === 0 && !loading && (
                        <div className="py-10 text-center text-white/20 italic text-sm">No items available yet.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-white/10 bg-surface/80 backdrop-blur-md flex gap-4 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all border border-white/10"
              >
                Close
              </button>
              <button
                onClick={handleViewMenu}
                className="flex-[2] bg-brand hover:bg-brand-dark text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                View Menu
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
