import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, limit, doc, setDoc, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Toaster, toast } from 'sonner';
import Navbar from './components/Navbar';
import ThreeHero from './components/ThreeHero';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import OrderTracking from './components/OrderTracking';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import GeminiChatbot from './components/GeminiChatbot';
import MapSection from './components/MapSection';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { MenuItem, OrderItem } from './types';

export default function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  useEffect(() => {
    const isOpen = isCartOpen || isProfileOpen || isAdminOpen;
    setIsAnyModalOpen(isOpen);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, isProfileOpen]);

  // Seed initial data if empty
  useEffect(() => {
    const seedData = async () => {
      if (loadingAuth) return;
      
      const restaurantsPath = 'restaurants';
      try {
        const q = query(collection(db, restaurantsPath), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty && user && user.email === 'shivamgaur72004@gmail.com') {
          console.log('Seeding initial data...');
          const restaurants = [
            {
              name: 'Sushi Zen',
              description: 'Authentic Japanese sushi and sashimi prepared by master chefs. Our fish is sourced daily from the Tsukiji market to ensure the highest quality and freshness. Experience the art of traditional sushi in a modern, elegant setting.',
              image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
              rating: 4.8,
              cuisine: 'Japanese',
              operatingHours: 'Mon-Sun: 11:00 AM - 10:00 PM',
              estimatedDeliveryTime: '25-35 mins'
            },
            {
              name: 'Burger Theory',
              description: 'Smackers burgers with locally sourced ingredients and secret sauces. We believe in the perfect balance of flavors, from our hand-pressed patties to our artisanal buns. Every bite is a testament to our passion for the ultimate burger experience.',
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
              rating: 4.5,
              cuisine: 'American',
              operatingHours: 'Mon-Sun: 10:00 AM - 11:00 PM',
              estimatedDeliveryTime: '20-30 mins'
            },
            {
              name: 'Pizza Roma',
              description: 'Wood-fired pizzas with thin crust and fresh Italian toppings. Our dough is fermented for 48 hours and baked at 900 degrees in our traditional brick oven. Taste the authentic flavors of Rome right here in your neighborhood.',
              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
              rating: 4.7,
              cuisine: 'Italian',
              operatingHours: 'Mon-Sun: 12:00 PM - 10:00 PM',
              estimatedDeliveryTime: '30-45 mins'
            }
          ];

          for (const res of restaurants) {
            const resRef = await addDoc(collection(db, restaurantsPath), res);
            const menuPath = `restaurants/${resRef.id}/menu`;
            const menuItems = [
              { name: 'Signature Roll', description: 'Fresh salmon, avocado, and cucumber.', price: 18.99, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=80', category: 'Main' },
              { name: 'Miso Soup', description: 'Traditional Japanese soup.', price: 5.99, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80', category: 'Side' },
              { name: 'Truffle Burger', description: 'Beef patty with truffle oil and swiss cheese.', price: 16.50, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80', category: 'Main' },
              { name: 'Margherita Pizza', description: 'Classic tomato and mozzarella.', price: 14.99, image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=400&q=80', category: 'Main' }
            ].filter(item => {
              if (res.name === 'Sushi Zen') return item.name.includes('Roll') || item.name.includes('Soup');
              if (res.name === 'Burger Theory') return item.name.includes('Burger');
              if (res.name === 'Pizza Roma') return item.name.includes('Pizza');
              return false;
            });

            for (const item of menuItems) {
              await addDoc(collection(db, menuPath), item);
            }
          }
        }
      } catch (error) {
        console.warn('Seeding skipped or failed:', error);
      }
    };

    seedData();
  }, [user, loadingAuth]);

  // Sync user to Firestore
  useEffect(() => {
    if (user) {
      const userPath = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user'
      }, { merge: true }).catch(error => {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      });
    }
  }, [user]);

  const addToCart = (item: MenuItem, restaurantId?: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, restaurantId }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, quantity: item.quantity + delta } : item
      );
      return updated.filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const checkout = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    const ordersPath = 'orders';
    try {
      // Fetch user profile for address
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid), limit(1)));
      const userProfile = userDoc.docs[0]?.data();
      const deliveryAddress = userProfile?.address || 'No address provided';
      const deliverySlot = userProfile?.preferredDeliverySlot || null;

      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const timestamp = serverTimestamp();
      const restaurantId = cartItems[0]?.restaurantId || 'various';
      
      const docRef = await addDoc(collection(db, ordersPath), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        userPhoto: user.photoURL || null,
        restaurantId,
        items: cartItems,
        total,
        status: 'pending',
        createdAt: timestamp,
        deliveryAddress,
        deliverySlot,
        statusHistory: [{
          status: 'pending',
          timestamp: timestamp
        }]
      });
      setCartItems([]);
      setIsCartOpen(false);
      setTrackingOrderId(docRef.id);
      toast.success('Order placed successfully! Tracking started.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ordersPath);
    }
  };

  const isAdmin = user?.email === 'shivamgaur72004@gmail.com';

  return (
    <ErrorBoundary>
      <main className="min-h-screen relative">
        <div className="atmosphere" />
        <Toaster position="top-center" richColors theme="dark" />
        
        <Navbar 
          cartCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)} 
          onProfileClick={() => setIsProfileOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
          isAdmin={isAdmin}
        />

        <ThreeHero 
          onSelectRestaurant={setSelectedRestaurantId} 
          selectedId={selectedRestaurantId} 
        />

        <OrderTracking 
          orderId={trackingOrderId} 
          onClose={() => setTrackingOrderId(null)} 
        />

        <MenuSection 
          onAddToCart={addToCart} 
          onUpdateQuantity={updateQuantity}
          cartItems={cartItems}
          selectedId={selectedRestaurantId}
          onSelectId={setSelectedRestaurantId}
        />

        <UserProfile 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          onTrackOrder={setTrackingOrderId}
        />

        <AdminDashboard 
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={checkout}
        />

        <GeminiChatbot />

        <MapSection />
        <Footer />
      </main>
    </ErrorBoundary>
  );
}
