import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, Mail, Shield, Save, X, Loader2, Sparkles, CreditCard, History, Plus, Trash2, Edit3, Package, ExternalLink, ChevronDown, ChevronUp, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { UserProfile as UserProfileType, PaymentMethod, UserActivity, Order, DeliverySlot } from '../types';
import { suggestAddress } from '../services/gemini';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export default function UserProfile({ isOpen, onClose, onTrackOrder }: UserProfileProps) {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    address: '',
    preferredDeliverySlot: '' as DeliverySlot | ''
  });
  const [newPayment, setNewPayment] = useState<Partial<PaymentMethod>>({
    type: 'visa',
    last4: '',
    isDefault: false
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfileType;
          setProfile(data);
          setFormData({
            displayName: data.displayName || '',
            address: data.address || '',
            preferredDeliverySlot: data.preferredDeliverySlot || ''
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'orders');
      });

      return () => {
        unsubscribeProfile();
        unsubscribeOrders();
      };
    }
  }, [user]);

  const handleSuggestAddress = async () => {
    if (!formData.address.trim()) {
      toast.error('Please type a partial address first');
      return;
    }
    setIsSuggesting(true);
    try {
      const suggestion = await suggestAddress(formData.address);
      if (suggestion) {
        setFormData(prev => ({ ...prev, address: suggestion }));
        toast.success('Address suggested by AI');
      }
    } catch (error) {
      console.error('Suggestion error:', error);
      toast.error('Failed to get suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    const userPath = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        address: formData.address,
        preferredDeliverySlot: formData.preferredDeliverySlot || null,
        // Log activity for profile update
        activity: [
          ...(profile?.activity || []),
          {
            id: Math.random().toString(36).substr(2, 9),
            type: 'profile_updated',
            description: 'Updated profile information',
            timestamp: new Date()
          }
        ].slice(-10) // Keep last 10 activities
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!user || !newPayment.last4) return;
    const userPath = `users/${user.uid}`;
    try {
      const updatedPayments = [
        ...(profile?.paymentMethods || []),
        {
          ...newPayment,
          id: Math.random().toString(36).substr(2, 9),
          isDefault: (profile?.paymentMethods || []).length === 0
        } as PaymentMethod
      ];
      await updateDoc(doc(db, 'users', user.uid), {
        paymentMethods: updatedPayments
      });
      toast.success('Payment method added');
      setIsAddingPayment(false);
      setNewPayment({ type: 'visa', last4: '', isDefault: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  };

  const handleRemovePayment = async (id: string) => {
    if (!user) return;
    try {
      const updatedPayments = (profile?.paymentMethods || []).filter(p => p.id !== id);
      await updateDoc(doc(db, 'users', user.uid), {
        paymentMethods: updatedPayments
      });
      toast.success('Payment method removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleEditActivity = async (id: string, newDescription: string) => {
    if (!user || !profile) return;
    try {
      const updatedActivity = profile.activity?.map(a => 
        a.id === id ? { ...a, description: newDescription } : a
      );
      await updateDoc(doc(db, 'users', user.uid), {
        activity: updatedActivity
      });
      setEditingActivityId(null);
      toast.success('Activity updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSubmitReview = async (order: Order) => {
    if (!user || !profile) return;
    setIsLoading(true);
    const reviewsPath = `restaurants/${order.restaurantId}/reviews`;
    try {
      await addDoc(collection(db, reviewsPath), {
        userId: user.uid,
        userName: profile.displayName || user.displayName || 'Anonymous',
        userPhoto: profile.photoURL || user.photoURL || null,
        orderId: order.id,
        rating: reviewRating,
        feedback: reviewFeedback,
        createdAt: serverTimestamp()
      });

      // Mark order as reviewed
      await updateDoc(doc(db, 'orders', order.id), {
        isReviewed: true
      });

      // Log activity
      await updateDoc(doc(db, 'users', user.uid), {
        activity: [
          ...(profile.activity || []),
          {
            id: Math.random().toString(36).substr(2, 9),
            type: 'review_submitted',
            description: `Left a ${reviewRating}-star review for order #${order.id.slice(-6).toUpperCase()}`,
            timestamp: new Date()
          }
        ].slice(-10)
      });

      toast.success('Review submitted successfully!');
      setReviewingOrderId(null);
      setReviewRating(5);
      setReviewFeedback('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, reviewsPath);
      toast.error('Failed to submit review');
    } finally {
      setIsLoading(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0502] border-l border-white/10 z-[70] p-8 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-12 shrink-0">
              <h2 className="text-3xl font-display font-bold">Profile</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {profile ? (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img 
                      src={profile.photoURL || ''} 
                      alt={profile.displayName || ''} 
                      className="w-24 h-24 rounded-full border-2 border-brand p-1"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1.5 rounded-full shadow-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{profile.displayName}</h3>
                  <p className="text-white/50 text-sm">{profile.email}</p>
                  <span className="mt-2 px-3 py-1 bg-brand/20 text-brand rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {profile.role}
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Personal Info</p>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-brand font-bold hover:underline"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-white/50">
                          <User className="w-3 h-3" />
                          Full Name
                        </label>
                        {isEditing ? (
                          <input 
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand transition-colors"
                          />
                        ) : (
                          <p className="text-sm font-medium">{profile.displayName || 'Not set'}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs text-white/50">
                          <Mail className="w-3 h-3" />
                          Email Address
                        </label>
                        <p className="text-sm font-medium opacity-50">{profile.email}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-white/50">
                            <MapPin className="w-3 h-3" />
                            Delivery Address
                          </label>
                          {isEditing && (
                            <button
                              onClick={handleSuggestAddress}
                              disabled={isSuggesting}
                              className="flex items-center gap-1 text-[10px] text-brand font-bold hover:underline disabled:opacity-50"
                            >
                              {isSuggesting ? (
                                <Loader2 className="w-2 h-2 animate-spin" />
                              ) : (
                                <Sparkles className="w-2 h-2" />
                              )}
                              Suggest
                            </button>
                          )}
                        </div>
                        {isEditing ? (
                          <textarea 
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand transition-colors resize-none"
                            placeholder="Enter your delivery address..."
                          />
                        ) : (
                          <p className="text-sm font-medium leading-relaxed">
                            {profile.address || 'No address saved yet.'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-white/50">
                            <Clock className="w-3 h-3" />
                            Preferred Delivery Slot
                          </label>
                        </div>
                        {isEditing ? (
                          <select 
                            value={formData.preferredDeliverySlot}
                            onChange={(e) => setFormData({ ...formData, preferredDeliverySlot: e.target.value as DeliverySlot })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand transition-colors"
                          >
                            <option value="" disabled>Select a slot</option>
                            <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                            <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                            <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                          </select>
                        ) : (
                          <p className="text-sm font-medium">
                            {profile.preferredDeliverySlot || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="w-full bg-brand hover:bg-brand-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}

                  {/* Payment Methods Section */}
                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand" />
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Payment Methods</p>
                      </div>
                      <button 
                        onClick={() => setIsAddingPayment(!isAddingPayment)}
                        className="p-1 hover:bg-white/10 rounded-lg text-brand transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {isAddingPayment && (
                        <div className="bg-white/5 border border-brand/30 p-4 rounded-2xl space-y-3">
                          <select 
                            value={newPayment.type}
                            onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as any })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          >
                            <option value="visa">Visa</option>
                            <option value="mastercard">Mastercard</option>
                            <option value="paypal">PayPal</option>
                          </select>
                          <input 
                            type="text"
                            maxLength={4}
                            placeholder="Last 4 digits"
                            value={newPayment.last4}
                            onChange={(e) => setNewPayment({ ...newPayment, last4: e.target.value.replace(/\D/g, '') })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          />
                          <button 
                            onClick={handleAddPayment}
                            className="w-full bg-brand text-white py-2 rounded-xl text-xs font-bold"
                          >
                            Add Card
                          </button>
                        </div>
                      )}

                      {profile.paymentMethods?.map(pm => (
                        <div key={pm.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-white/50" />
                            </div>
                            <div>
                              <p className="text-sm font-bold uppercase">{pm.type} •••• {pm.last4}</p>
                              {pm.isDefault && <span className="text-[8px] text-brand font-bold uppercase tracking-widest">Default</span>}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemovePayment(pm.id)}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(!profile.paymentMethods || profile.paymentMethods.length === 0) && !isAddingPayment && (
                        <p className="text-xs text-white/20 italic text-center py-2">No payment methods added</p>
                      )}
                    </div>
                  </div>

                  {/* Orders Section */}
                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand" />
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Your Orders</p>
                    </div>

                    <div className="space-y-3">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold">Order #{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                {order.deliverySlot && ` • ${order.deliverySlot}`}
                              </p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                              order.status === 'delivered' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                              order.status === 'cancelled' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                              "bg-brand/10 border-brand/20 text-brand"
                            )}>
                              {order.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-brand">${order.total.toFixed(2)}</p>
                              <button 
                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                className="flex items-center gap-1 text-[8px] text-white/30 hover:text-white mt-1 transition-colors"
                              >
                                {expandedOrderId === order.id ? (
                                  <>Hide Items <ChevronUp className="w-2 h-2" /></>
                                ) : (
                                  <>View Items <ChevronDown className="w-2 h-2" /></>
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              {order.status === 'delivered' && !order.isReviewed && (
                                <button 
                                  onClick={() => setReviewingOrderId(order.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-brand hover:text-brand-dark transition-colors"
                                >
                                  Leave Review
                                  <Star className="w-2 h-2 fill-brand" />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  onTrackOrder(order.id);
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold text-white/50 hover:text-white transition-colors"
                              >
                                Track Order
                                <ExternalLink className="w-2 h-2" />
                              </button>
                            </div>
                          </div>

                          {/* Review Form */}
                          <AnimatePresence>
                            {reviewingOrderId === order.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-4 border-t border-white/5 mt-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Rate your experience</p>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => setReviewRating(star)}
                                          className="p-1"
                                        >
                                          <Star 
                                            className={cn(
                                              "w-4 h-4 transition-all",
                                              star <= reviewRating ? "fill-brand text-brand" : "text-white/20"
                                            )} 
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <textarea 
                                    value={reviewFeedback}
                                    onChange={(e) => setReviewFeedback(e.target.value)}
                                    placeholder="Tell us about your food..."
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand transition-colors resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setReviewingOrderId(null)}
                                      className="flex-1 py-2 rounded-xl text-[10px] font-bold border border-white/10 hover:bg-white/5 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={() => handleSubmitReview(order)}
                                      disabled={isLoading || !reviewFeedback.trim()}
                                      className="flex-1 bg-brand py-2 rounded-xl text-[10px] font-bold text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
                                    >
                                      {isLoading ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Order Items List */}
                          <AnimatePresence>
                            {expandedOrderId === order.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 space-y-2 border-t border-white/5 mt-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                      <span className="text-white/60">
                                        <span className="text-brand font-bold">{item.quantity}x</span> {item.name}
                                      </span>
                                      <span className="text-white/40">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <p className="text-xs text-white/20 italic text-center py-2">No orders yet</p>
                      )}
                    </div>
                  </div>

                  {/* Activity Section */}
                  <div className="glass rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-brand" />
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Recent Activity</p>
                    </div>

                    <div className="space-y-4">
                      {profile.activity?.map(act => (
                        <div key={act.id} className="relative pl-6 border-l border-white/10 pb-4 last:pb-0">
                          <div className="absolute left-[-4.5px] top-0 w-2 h-2 rounded-full bg-brand shadow-[0_0_8px_rgba(255,78,0,0.5)]" />
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {editingActivityId === act.id ? (
                                <div className="flex gap-2">
                                  <input 
                                    autoFocus
                                    defaultValue={act.description}
                                    onBlur={(e) => handleEditActivity(act.id, e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleEditActivity(act.id, (e.target as HTMLInputElement).value)}
                                    className="flex-1 bg-white/5 border border-brand/30 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-white/80 leading-relaxed">{act.description}</p>
                              )}
                              <p className="text-[10px] text-white/30 mt-1">
                                {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleString() : new Date(act.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <button 
                              onClick={() => setEditingActivityId(act.id)}
                              className="p-1 text-white/20 hover:text-brand transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!profile.activity || profile.activity.length === 0) && (
                        <p className="text-xs text-white/20 italic text-center py-2">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">
                    Role management is restricted to administrators only.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/30">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading profile...</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
