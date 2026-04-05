import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { UserProfile, PaymentMethod, UserActivity, Restaurant, MenuItem, Order } from '../types';
import { Plus, Trash2, Edit2, X, Save, Utensils, LayoutGrid, Users, Shield, Mail, MapPin, CreditCard, History, Edit3, Loader2, Package, CheckCircle2, Clock, Truck, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'users' | 'orders'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAddingRes, setIsAddingRes] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  
  const [newRes, setNewRes] = useState({
    name: '',
    description: '',
    image: '',
    cuisine: '',
    rating: 4.5,
    estimatedDeliveryTime: '30-45 mins'
  });

  const [userFormData, setUserFormData] = useState({
    displayName: '',
    address: '',
    role: 'user' as 'user' | 'admin',
    preferredDeliverySlot: '' as string
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'Main'
  });

  useEffect(() => {
    if (!isOpen) return;
    
    // Listen to restaurants
    const resQ = query(collection(db, 'restaurants'));
    const resUnsubscribe = onSnapshot(resQ, (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant)));
    });

    // Listen to users
    const usersQ = query(collection(db, 'users'));
    const usersUnsubscribe = onSnapshot(usersQ, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });

    // Listen to orders
    const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const ordersUnsubscribe = onSnapshot(ordersQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      resUnsubscribe();
      usersUnsubscribe();
      ordersUnsubscribe();
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedUserId) {
      const selectedUser = users.find(u => u.uid === selectedUserId);
      if (selectedUser) {
        setUserFormData({
          displayName: selectedUser.displayName || '',
          address: selectedUser.address || '',
          role: selectedUser.role,
          preferredDeliverySlot: selectedUser.preferredDeliverySlot || ''
        });
      }
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedResId) {
      setMenuItems([]);
      return;
    }
    const q = query(collection(db, `restaurants/${selectedResId}/menu`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });
    return () => unsubscribe();
  }, [selectedResId]);

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'restaurants'), newRes);
      setIsAddingRes(false);
      setNewRes({ name: '', description: '', image: '', cuisine: '', rating: 4.5, estimatedDeliveryTime: '30-45 mins' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'restaurants');
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId) return;
    try {
      await addDoc(collection(db, `restaurants/${selectedResId}/menu`), newItem);
      setIsAddingItem(false);
      setNewItem({ name: '', description: '', price: 0, image: '', category: 'Main' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `restaurants/${selectedResId}/menu`);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure? This will not delete the menu items automatically in this demo.')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', id));
      if (selectedResId === id) setSelectedResId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${id}`);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteDoc(doc(db, `restaurants/${selectedResId}/menu`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `restaurants/${selectedResId}/menu/${id}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserId) return;
    setIsSavingUser(true);
    try {
      await updateDoc(doc(db, 'users', selectedUserId), userFormData);
      toast.success('User updated successfully');
      setIsEditingUser(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedUserId}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleRemovePayment = async (userId: string, paymentId: string) => {
    if (!confirm('Remove this payment method?')) return;
    const user = users.find(u => u.uid === userId);
    if (!user) return;
    try {
      const updatedPayments = (user.paymentMethods || []).filter(p => p.id !== paymentId);
      await updateDoc(doc(db, 'users', userId), { paymentMethods: updatedPayments });
      toast.success('Payment method removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleEditActivity = async (userId: string, activityId: string, newDesc: string) => {
    const user = users.find(u => u.uid === userId);
    if (!user) return;
    try {
      const updatedActivity = (user.activity || []).map(a => 
        a.id === activityId ? { ...a, description: newDesc } : a
      );
      await updateDoc(doc(db, 'users', userId), { activity: updatedActivity });
      toast.success('Activity updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const timestamp = serverTimestamp();
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: timestamp
        })
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-6xl h-full bg-surface border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Admin Panel</h2>
                <p className="text-white/50 text-sm">Manage platform data & users</p>
              </div>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('restaurants')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'restaurants' ? "bg-brand text-white shadow-lg" : "text-white/50 hover:text-white"
                )}
              >
                <Utensils className="w-4 h-4" />
                Restaurants
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'users' ? "bg-brand text-white shadow-lg" : "text-white/50 hover:text-white"
                )}
              >
                <Users className="w-4 h-4" />
                Users
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  activeTab === 'orders' ? "bg-brand text-white shadow-lg" : "text-white/50 hover:text-white"
                )}
              >
                <Package className="w-4 h-4" />
                Orders
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'restaurants' ? (
            <>
              {/* Restaurants List */}
              <div className="w-1/3 border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-white uppercase tracking-widest text-xs">Restaurants</h3>
                  <button 
                    onClick={() => setIsAddingRes(true)}
                    className="p-2 bg-brand/20 text-brand hover:bg-brand hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {restaurants.map(res => (
                    <div 
                      key={res.id}
                      onClick={() => setSelectedResId(res.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                        selectedResId === res.id 
                          ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' 
                          : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{res.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteRestaurant(res.id); }}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] opacity-60 mt-1 uppercase tracking-wider">{res.cuisine}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu Items List */}
              <div className="flex-1 flex flex-col bg-black/20">
                {selectedResId ? (
                  <>
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white uppercase tracking-widest text-xs">Menu Items</h3>
                        <p className="text-[10px] text-white/30 mt-1">
                          Managing menu for <span className="text-brand">{restaurants.find(r => r.id === selectedResId)?.name}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsAddingItem(true)}
                        className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {menuItems.map(item => (
                        <div key={item.id} className="glass p-4 rounded-2xl flex gap-4 items-center group">
                          <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">{item.name}</h4>
                            <p className="text-brand font-bold text-sm">${item.price.toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {menuItems.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center text-white/20 py-20">
                          <Utensils className="w-12 h-12 mb-4 opacity-10" />
                          <p className="italic">No items in this menu yet</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-10 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Utensils className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-white/40">Select a Restaurant</h3>
                    <p className="max-w-xs mt-2">Choose a restaurant from the left to manage its menu items and pricing.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'users' ? (
            <>
              {/* Users List */}
              <div className="w-1/3 border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                  <h3 className="font-bold text-white uppercase tracking-widest text-xs">Platform Users</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {users.map(u => (
                    <div 
                      key={u.uid}
                      onClick={() => setSelectedUserId(u.uid)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center gap-3 ${
                        selectedUserId === u.uid 
                          ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' 
                          : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <img src={u.photoURL || ''} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-sm">{u.displayName || 'Anonymous'}</p>
                        <p className="text-[10px] opacity-60 truncate">{u.email}</p>
                      </div>
                      {u.role === 'admin' && <Shield className="w-3 h-3 text-brand" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* User Details */}
              <div className="flex-1 flex flex-col bg-black/20 overflow-y-auto custom-scrollbar">
                {selectedUserId ? (
                  <div className="p-8 space-y-8">
                    {/* User Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <img 
                          src={users.find(u => u.uid === selectedUserId)?.photoURL || ''} 
                          className="w-20 h-20 rounded-full border-2 border-brand p-1" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-2xl font-bold text-white">{users.find(u => u.uid === selectedUserId)?.displayName}</h3>
                          <p className="text-white/50">{users.find(u => u.uid === selectedUserId)?.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditingUser(!isEditingUser)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        {isEditingUser ? 'Cancel Editing' : 'Edit Details'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Info */}
                      <div className="glass p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-2 text-brand">
                          <Shield className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-widest">Account Info</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-white/30 uppercase font-bold">Display Name</label>
                            {isEditingUser ? (
                              <input 
                                value={userFormData.displayName}
                                onChange={e => setUserFormData({...userFormData, displayName: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand outline-none"
                              />
                            ) : (
                              <p className="text-sm text-white/80">{users.find(u => u.uid === selectedUserId)?.displayName || 'Not set'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-white/30 uppercase font-bold">Delivery Address</label>
                            {isEditingUser ? (
                              <textarea 
                                value={userFormData.address}
                                onChange={e => setUserFormData({...userFormData, address: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand outline-none h-20 resize-none"
                              />
                            ) : (
                              <p className="text-sm text-white/80 leading-relaxed">{users.find(u => u.uid === selectedUserId)?.address || 'No address saved'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-white/30 uppercase font-bold">Preferred Delivery Slot</label>
                            {isEditingUser ? (
                              <select 
                                value={userFormData.preferredDeliverySlot}
                                onChange={e => setUserFormData({...userFormData, preferredDeliverySlot: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand outline-none"
                              >
                                <option value="">Not set</option>
                                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                                <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                                <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                              </select>
                            ) : (
                              <p className="text-sm text-white/80">{users.find(u => u.uid === selectedUserId)?.preferredDeliverySlot || 'Not set'}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-white/30 uppercase font-bold">Platform Role</label>
                            {isEditingUser ? (
                              <select 
                                value={userFormData.role}
                                onChange={e => setUserFormData({...userFormData, role: e.target.value as any})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-brand outline-none"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className="inline-block px-3 py-1 bg-brand/20 text-brand rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {users.find(u => u.uid === selectedUserId)?.role}
                              </span>
                            )}
                          </div>

                          {isEditingUser && (
                            <button 
                              onClick={handleUpdateUser}
                              disabled={isSavingUser}
                              className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                            >
                              {isSavingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              Save User Changes
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="glass p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-2 text-brand">
                          <CreditCard className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-widest">Payment Methods</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {users.find(u => u.uid === selectedUserId)?.paymentMethods?.map(pm => (
                            <div key={pm.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-white/30" />
                                <p className="text-sm font-bold uppercase text-white/80">{pm.type} •••• {pm.last4}</p>
                              </div>
                              <button 
                                onClick={() => handleRemovePayment(selectedUserId, pm.id)}
                                className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {(!users.find(u => u.uid === selectedUserId)?.paymentMethods || users.find(u => u.uid === selectedUserId)?.paymentMethods?.length === 0) && (
                            <p className="text-xs text-white/20 italic text-center py-4">No payment methods found</p>
                          )}
                        </div>
                      </div>

                      {/* Activity History */}
                      <div className="glass p-6 rounded-3xl space-y-6 lg:col-span-2">
                        <div className="flex items-center gap-2 text-brand">
                          <History className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-widest">User Activity History</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {users.find(u => u.uid === selectedUserId)?.activity?.map(act => (
                            <div key={act.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-start group">
                              <div className="flex-1">
                                <p className="text-xs text-white/80 leading-relaxed">{act.description}</p>
                                <p className="text-[10px] text-white/30 mt-2">
                                  {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleString() : new Date(act.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  const newDesc = prompt('Edit activity description:', act.description);
                                  if (newDesc) handleEditActivity(selectedUserId, act.id, newDesc);
                                }}
                                className="p-2 text-white/20 hover:text-brand transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {(!users.find(u => u.uid === selectedUserId)?.activity || users.find(u => u.uid === selectedUserId)?.activity?.length === 0) && (
                            <p className="col-span-full text-xs text-white/20 italic text-center py-8">No activity recorded for this user</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-10 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-white/40">Select a User</h3>
                    <p className="max-w-xs mt-2">Choose a user from the left to view and manage their account details.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col bg-black/20 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Active & Past Orders</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    <div className="w-2 h-2 rounded-full bg-brand" /> Pending
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> Delivered
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {orders.map(order => (
                    <div key={order.id} className="glass p-6 rounded-[2rem] space-y-6 border border-white/5 hover:border-brand/30 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <Package className="w-6 h-6 text-brand" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Order #{order.id.slice(-6).toUpperCase()}</h4>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                          order.status === 'delivered' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                          order.status === 'cancelled' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                          "bg-brand/10 border-brand/20 text-brand"
                        )}>
                          {order.status}
                        </div>
                      </div>

                      <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <img src={order.userPhoto || ''} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white">{order.userName}</p>
                              <p className="text-[10px] text-white/50 truncate">{order.deliveryAddress}</p>
                              {order.deliverySlot && (
                                <p className="text-[8px] text-brand font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                                  <Clock className="w-2 h-2" />
                                  Slot: {order.deliverySlot}
                                </p>
                              )}
                            </div>
                          </div>

                        <div className="space-y-2">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Order Items</p>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-white/70">{item.quantity}x {item.name}</span>
                                <span className="text-white/50">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/5">
                            <span className="text-xs font-bold text-white">Total Amount</span>
                            <span className="text-sm font-bold text-brand">${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-4 space-y-3">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Update Status</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { s: 'preparing', icon: Clock, color: 'hover:bg-blue-500/20 hover:text-blue-400' },
                              { s: 'on-the-way', icon: Truck, color: 'hover:bg-brand/20 hover:text-brand' },
                              { s: 'delivered', icon: CheckCircle2, color: 'hover:bg-green-500/20 hover:text-green-400' },
                              { s: 'cancelled', icon: Ban, color: 'hover:bg-red-500/20 hover:text-red-400' }
                            ].map(({ s, icon: Icon, color }) => (
                              <button
                                key={s}
                                onClick={() => handleUpdateOrderStatus(order.id, s as any)}
                                disabled={order.status === s}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                                  order.status === s ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-white/30 " + color
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-[8px] font-bold uppercase tracking-tighter">{s.replace(/-/g, ' ')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-white/20 py-20">
                      <Package className="w-12 h-12 mb-4 opacity-10" />
                      <p className="italic">No orders placed on the platform yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals for Adding */}
        <AnimatePresence>
          {isAddingRes && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddingRes(false)} />
              <motion.form 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onSubmit={handleAddRestaurant}
                className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <h3 className="text-xl font-bold text-white">Add New Restaurant</h3>
                <div className="space-y-4">
                  <input required placeholder="Restaurant Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} />
                  <input required placeholder="Cuisine Type" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newRes.cuisine} onChange={e => setNewRes({...newRes, cuisine: e.target.value})} />
                  <input required placeholder="Estimated Delivery Time (e.g. 30-45 mins)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newRes.estimatedDeliveryTime} onChange={e => setNewRes({...newRes, estimatedDeliveryTime: e.target.value})} />
                  <input required placeholder="Image URL" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newRes.image} onChange={e => setNewRes({...newRes, image: e.target.value})} />
                  <textarea required placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all h-24" value={newRes.description} onChange={e => setNewRes({...newRes, description: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsAddingRes(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand/20">Add Restaurant</button>
                </div>
              </motion.form>
            </div>
          )}

          {isAddingItem && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddingItem(false)} />
              <motion.form 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onSubmit={handleAddMenuItem}
                className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <h3 className="text-xl font-bold text-white">Add Menu Item</h3>
                <div className="space-y-4">
                  <input required placeholder="Item Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                  <input required type="number" step="0.01" placeholder="Price" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} />
                  <input required placeholder="Image URL" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                  <textarea required placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all h-24" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand/20">Add to Menu</button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
