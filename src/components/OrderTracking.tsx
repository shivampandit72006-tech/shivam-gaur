import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, Bike, CheckCircle2, Clock, Phone, MessageSquare, ChevronRight, Star, Plus, Minus } from 'lucide-react';
import { Order, StatusUpdate, Restaurant } from '../types';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

interface OrderTrackingProps {
  orderId: string | null;
  onClose: () => void;
}

export default function OrderTracking({ orderId, onClose }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
      if (snapshot.exists()) {
        setOrder({ id: snapshot.id, ...snapshot.data() } as Order);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
    });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    if (!order?.restaurantId || order.restaurantId === 'various') return;

    const fetchRestaurant = async () => {
      try {
        const resDoc = await getDoc(doc(db, 'restaurants', order.restaurantId));
        if (resDoc.exists()) {
          setRestaurant({ id: resDoc.id, ...resDoc.data() } as Restaurant);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      }
    };

    fetchRestaurant();
  }, [order?.restaurantId]);

  // Simulate delivery progress based on status
  useEffect(() => {
    if (!order) return;

    let targetProgress = 0;
    switch (order.status) {
      case 'pending': targetProgress = 5; break;
      case 'preparing': targetProgress = 25; break;
      case 'on-the-way': targetProgress = 65; break;
      case 'delivered': targetProgress = 100; break;
      default: targetProgress = 0;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < targetProgress) return Math.min(prev + 1, targetProgress);
        if (prev > targetProgress) return Math.max(prev - 1, targetProgress);
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [order?.status]);

  if (!orderId) return null;

  const steps = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'preparing', label: 'Preparing', icon: CheckCircle2 },
    { status: 'on-the-way', label: 'On the Way', icon: Bike },
    { status: 'delivered', label: 'Delivered', icon: MapPin },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order?.status);

  return (
    <AnimatePresence>
      {orderId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl h-full max-h-[85vh] bg-surface border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl"
          >
            {/* Left Side: Map Simulation */}
            <div className="relative flex-1 bg-[#1a1a1a] overflow-hidden min-h-[300px] md:min-h-0">
              {/* Simulated Map Grid */}
              <div className="absolute inset-0 opacity-10" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px' 
                }} 
              />
              
              {/* Simulated Roads */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 400">
                <path d="M0 100 H400 M0 200 H400 M0 300 H400 M100 0 V400 M200 0 V400 M300 0 V400" stroke="white" strokeWidth="2" fill="none" />
                <path d="M50 50 L350 350 M350 50 L50 350" stroke="white" strokeWidth="1" fill="none" />
              </svg>

              {/* Delivery Path */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <motion.path
                  d="M50 350 Q 150 350, 150 250 T 250 150 T 350 50"
                  stroke="rgba(255, 115, 0, 0.2)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M50 350 Q 150 350, 150 250 T 250 150 T 350 50"
                  stroke="#ff7300"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset={1000 - (progress * 10)}
                />
              </svg>

              {/* Restaurant Marker */}
              <div className="absolute bottom-[50px] left-[50px] -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-2 shadow-xl">
                  <MapPin className="w-5 h-5 text-brand" />
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest truncate max-w-[80px]">
                  {restaurant?.name || 'Restaurant'}
                </span>
              </div>

              {/* User Marker */}
              <div className="absolute top-[50px] right-[50px] translate-x-1/2 translate-y-1/2 text-center">
                <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center mb-2 shadow-xl shadow-brand/20">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">You</span>
              </div>

              {/* Delivery Agent Marker */}
              {order?.status === 'on-the-way' && (
                <motion.div 
                  style={{
                    position: 'absolute',
                    left: `${50 + (progress * 3)}px`,
                    top: `${350 - (progress * 3)}px`,
                  }}
                  className="z-20"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand rounded-full animate-ping opacity-20" />
                    <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20 relative">
                      <Bike className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Map Controls Placeholder */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute top-6 left-6">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-white/70">Live Tracking Active</span>
                </div>
              </div>
            </div>

            {/* Right Side: Order Info */}
            <div className="w-full md:w-[400px] bg-surface flex flex-col border-l border-white/10">
              <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-display font-bold">Track Order</h2>
                  <p className="text-white/30 text-xs font-mono mt-1">#{orderId.slice(-8).toUpperCase()}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Restaurant Info */}
                {restaurant && (
                  <div className="bg-brand/5 border border-brand/10 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-brand/20">
                        <img 
                          src={restaurant.image} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{restaurant.name}</h3>
                        <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1">{restaurant.cuisine}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="space-y-6">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div key={step.status} className="flex gap-4 relative">
                        {index < steps.length - 1 && (
                          <div className={cn(
                            "absolute left-[19px] top-10 w-[2px] h-10 transition-colors duration-500",
                            index < currentStepIndex ? "bg-brand" : "bg-white/5"
                          )} />
                        )}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 border",
                          isCompleted ? "bg-brand/20 border-brand/20 text-brand" : "bg-white/5 border-white/5 text-white/20",
                          isCurrent && "ring-4 ring-brand/10 scale-110"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="pt-2">
                          <h4 className={cn(
                            "font-bold text-sm transition-colors duration-500",
                            isCompleted ? "text-white" : "text-white/20"
                          )}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1">In Progress</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Info */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100" 
                        alt="Driver"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">Alex Johnson</h4>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-bold">4.9</span>
                        </div>
                      </div>
                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">Your Delivery Partner</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group">
                      <Phone className="w-4 h-4 text-white/50 group-hover:text-white" />
                      <span className="text-xs font-bold">Call</span>
                    </button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group">
                      <MessageSquare className="w-4 h-4 text-white/50 group-hover:text-white" />
                      <span className="text-xs font-bold">Message</span>
                    </button>
                  </div>
                </div>

                {/* Order Summary Preview */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Order Details</h4>
                  <div className="space-y-3">
                    {order?.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-white/70">{item.quantity}x {item.name}</span>
                        <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="font-bold">Total Paid</span>
                      <span className="text-brand font-bold text-lg">${order?.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/10 bg-white/5 shrink-0">
                <button 
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
