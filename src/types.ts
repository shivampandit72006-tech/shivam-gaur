export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'paypal';
  last4?: string;
  email?: string;
  isDefault: boolean;
}

export interface UserActivity {
  id: string;
  type: 'order_placed' | 'profile_updated' | 'review_submitted';
  description: string;
  timestamp: any;
}

export type DeliverySlot = 'Morning (9 AM - 12 PM)' | 'Afternoon (1 PM - 4 PM)' | 'Evening (5 PM - 8 PM)';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  address?: string;
  paymentMethods?: PaymentMethod[];
  activity?: UserActivity[];
  preferredDeliverySlot?: DeliverySlot;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  cuisine: string;
  operatingHours?: string;
  estimatedDeliveryTime?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId?: string;
}

export interface StatusUpdate {
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
  timestamp: any; // Firestore Timestamp
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  restaurantId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  statusHistory?: StatusUpdate[];
  deliveryAddress?: string;
  rating?: number;
  feedback?: string;
  isReviewed?: boolean;
  deliverySlot?: DeliverySlot;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  orderId: string;
  rating: number;
  feedback: string;
  createdAt: any;
}
