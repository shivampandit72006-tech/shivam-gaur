import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Restaurant, MenuItem, OrderItem } from '../types';
import { Star, Plus, Minus, ChevronRight, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import RestaurantModal from './RestaurantModal';

interface MenuSectionProps {
  onAddToCart: (item: MenuItem, restaurantId?: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  cartItems: OrderItem[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export default function MenuSection({ 
  onAddToCart, 
  onUpdateQuantity,
  cartItems,
  selectedId, 
  onSelectId 
}: MenuSectionProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [modalRestaurant, setModalRestaurant] = useState<Restaurant | null>(null);
  
  useEffect(() => {
    if (modalRestaurant) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalRestaurant]);

  const selectedRestaurant = restaurants.find(r => r.id === selectedId) || null;

  const cuisines = Array.from(new Set(restaurants.map(r => r.cuisine))).sort();

  const filteredRestaurants = selectedCuisine 
    ? restaurants.filter(r => r.cuisine === selectedCuisine)
    : restaurants;

  useEffect(() => {
    const restaurantsPath = 'restaurants';
    const q = query(collection(db, restaurantsPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
      setRestaurants(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, restaurantsPath);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      const menuPath = `restaurants/${selectedId}/menu`;
      const q = query(collection(db, menuPath));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, menuPath);
      });
      return () => unsubscribe();
    }
  }, [selectedId]);

  if (loading) return <div className="py-20 text-center text-white/50">Loading restaurants...</div>;

  return (
    <section id="menu" className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold">
            {selectedRestaurant ? selectedRestaurant.name : 'Popular Restaurants'}
          </h2>
          {!selectedRestaurant && (
            <p className="text-white/50 mt-2">Discover the best food & drinks in your area</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {!selectedRestaurant && (
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCuisine(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  !selectedCuisine 
                    ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" 
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                )}
              >
                All Cuisines
              </button>
              {cuisines.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    selectedCuisine === cuisine 
                      ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" 
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                  )}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          )}
          
          {selectedRestaurant && (
            <button 
              onClick={() => onSelectId(null)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to all
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedRestaurant ? (
          <motion.div 
            key="restaurants"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredRestaurants.map((res) => (
              <motion.div
                key={res.id}
                whileHover={{ y: -10 }}
                className="glass rounded-3xl overflow-hidden cursor-pointer group"
                onClick={() => setModalRestaurant(res)}
              >
                <div className="h-48 relative overflow-hidden bg-black/20">
                  <img 
                    src={res.image} 
                    alt={res.name} 
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110 transition-transform duration-500 group-hover:scale-125"
                    referrerPolicy="no-referrer"
                  />
                  <img 
                    src={res.image} 
                    alt={res.name} 
                    className="relative w-full h-full object-contain z-10 transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 z-20">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold">{res.rating}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30">
                    <div className="bg-brand text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      View Details
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{res.name}</h3>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-brand transition-colors" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-sm">{res.cuisine}</p>
                    {res.estimatedDeliveryTime && (
                      <div className="flex items-center gap-1 text-brand text-[10px] font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {res.estimatedDeliveryTime}
                      </div>
                    )}
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{res.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {menuItems.map((item) => (
              <motion.div 
                key={item.id} 
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="glass rounded-2xl p-4 flex gap-4 items-center"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0 bg-black/20">
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
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{item.name}</h4>
                  <p className="text-white/50 text-xs mb-2 line-clamp-1">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand font-bold">${item.price.toFixed(2)}</span>
                    
                    {cartItems.find(i => i.id === item.id) ? (
                      <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1 hover:text-brand transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">
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
                        onClick={() => onAddToCart(item, selectedId || undefined)}
                        className="bg-brand hover:bg-brand-dark p-2 rounded-lg transition-colors shadow-lg shadow-brand/20"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {menuItems.length === 0 && (
              <div className="col-span-full py-20 text-center text-white/30 italic">
                No menu items found for this restaurant.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RestaurantModal
        restaurant={modalRestaurant}
        isOpen={!!modalRestaurant}
        onClose={() => setModalRestaurant(null)}
        onSelectMenu={onSelectId}
        onAddToCart={onAddToCart}
        onUpdateQuantity={onUpdateQuantity}
        cartItems={cartItems}
      />
    </section>
  );
}
