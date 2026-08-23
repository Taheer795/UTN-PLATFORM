import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  Wallet, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck, 
  Tag, 
  Users, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Zap, 
  UserCheck, 
  ArrowUpRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionHubProps {
  cart: any[];
  user: User | null;
  isAdminUser?: boolean;
  onReturnToStore: () => void;
}

interface CustomerSummary {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  totalItems: number;
  completedOrdersCount: number;
  lastPurchaseDate: string;
  orders: any[];
}

export default function TransactionHub({ cart, user, isAdminUser = false, onReturnToStore }: TransactionHubProps) {
  const isAdmin = isAdminUser || user?.email?.toLowerCase() === 'itztahirismail@gmail.com';
  const [activeTab, setActiveTab] = useState<'customers' | 'all-transactions'>('customers');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, any>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [confirmingDocId, setConfirmingDocId] = useState<string | null>(null);

  const handleConfirmPayment = async (docId: string) => {
    if (!docId) return;
    setConfirmingDocId(docId);
    try {
      await updateDoc(doc(db, 'requests', docId), { status: 'paid' });
    } catch (err) {
      console.error("Failed to approve payment:", err);
      handleFirestoreError(err, OperationType.UPDATE, `requests/${docId}`);
    } finally {
      setConfirmingDocId(null);
    }
  };

  // Fetch registered users from Firestore for Admin customer enrichment
  useEffect(() => {
    if (!isAdmin) return;
    const fetchRegisteredUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userMap: Record<string, any> = {};
        querySnapshot.forEach((docSnap) => {
          userMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setRegisteredUsers(userMap);
      } catch (err) {
        console.error("Error fetching registered users for Transaction Hub:", err);
        handleFirestoreError(err, OperationType.LIST, 'users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchRegisteredUsers();
  }, [isAdmin]);

  // Filter transactions based on status filter (Default 'all' so admin sees all requests and orders)
  const transactionsToProcess = cart.filter(item => {
    if (statusFilter === 'paid') return item.status === 'paid' || item.status === 'completed';
    if (statusFilter === 'pending') return item.status !== 'paid' && item.status !== 'completed';
    return true;
  });

  // Calculate metrics for current logged-in user or store-wide
  const totalCompletedCount = transactionsToProcess.length;

  const totalAmountSpent = transactionsToProcess.reduce((sum, item) => {
    const val = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    return sum + val;
  }, 0);

  const totalItemsPurchased = transactionsToProcess.reduce((sum, item) => {
    const qty = parseInt(item.customization?.quantity || item.quantity || '1') || 1;
    return sum + qty;
  }, 0);

  // Group transactions by customer for Admin Dashboard
  const customerMap: Record<string, CustomerSummary> = {};

  transactionsToProcess.forEach((order) => {
    const rawUid = order.userId || order.deliveryDetails?.email || 'guest_user';
    const profile = registeredUsers[rawUid] || {};

    const name = profile.displayName || 
      (profile.firstName ? `${profile.firstName} ${profile.surname || ''}`.trim() : '') ||
      order.deliveryDetails?.fullName || 
      'Anonymous Customer';

    const email = profile.email || order.deliveryDetails?.email || 'No email registered';
    const phone = profile.phone || order.deliveryDetails?.phone || 'N/A';
    const address = order.deliveryDetails?.address || 'N/A';

    const orderPrice = typeof order.price === 'number' ? order.price : parseFloat(order.price) || 0;
    const orderQty = parseInt(order.customization?.quantity || order.quantity || '1') || 1;
    const orderDateStr = order.orderDate || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toISOString() : new Date().toISOString());

    if (!customerMap[rawUid]) {
      customerMap[rawUid] = {
        userId: rawUid,
        name,
        email,
        phone,
        address,
        totalSpent: 0,
        totalItems: 0,
        completedOrdersCount: 0,
        lastPurchaseDate: orderDateStr,
        orders: []
      };
    }

    customerMap[rawUid].totalSpent += orderPrice;
    customerMap[rawUid].totalItems += orderQty;
    customerMap[rawUid].completedOrdersCount += 1;
    customerMap[rawUid].orders.push(order);

    if (new Date(orderDateStr) > new Date(customerMap[rawUid].lastPurchaseDate)) {
      customerMap[rawUid].lastPurchaseDate = orderDateStr;
    }
  });

  // Include registered users who haven't made a purchase yet in admin directory if needed
  Object.keys(registeredUsers).forEach((uid) => {
    if (!customerMap[uid]) {
      const u = registeredUsers[uid];
      const name = u.displayName || (u.firstName ? `${u.firstName} ${u.surname || ''}`.trim() : 'Registered User');
      customerMap[uid] = {
        userId: uid,
        name,
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        address: 'N/A',
        totalSpent: 0,
        totalItems: 0,
        completedOrdersCount: 0,
        lastPurchaseDate: 'No purchases yet',
        orders: []
      };
    }
  });

  const customerList = Object.values(customerMap);
  const activePurchasingCustomers = customerList.filter(c => c.completedOrdersCount > 0);

  // Filter customer list based on search query
  const filteredCustomers = customerList.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.userId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight italic tracking-tight">
            {isAdminUser ? 'Admin Customer Transaction Dashboard' : 'Transaction Hub'}
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            {isAdminUser 
              ? 'Cumulative Customer Metrics, Purchase Directories & Verified Financial Records' 
              : 'Verified Personal History & Financial Metrics Across Completed Orders'}
          </p>
        </div>
        <button
          onClick={onReturnToStore}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm w-fit"
        >
          Return to Store
        </button>
      </div>

      {/* Overview Cards */}
      {isAdmin ? (
        /* Admin Storewide Overview Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Storewide Revenue</p>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              ₦{totalAmountSpent.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Cumulative Transactions Earnings</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Registered Customers</p>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-indigo-950 tracking-tight mt-3">
              {customerList.length}
            </h3>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">
              {activePurchasingCustomers.length} Active Buyers Logged
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Orders</p>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {totalCompletedCount}
            </h3>
            <p className="text-[10px] text-blue-600 font-bold mt-1">Total Customer Transactions</p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Items Purchased</p>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              {totalItemsPurchased}
            </h3>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Total Assets Delivered</p>
          </div>
        </div>
      ) : (
        /* Regular Customer Overview Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Completed Orders</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalCompletedCount}</h3>
              <p className="text-[10px] text-emerald-600 font-bold">Verified Transactions</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Capital Spent</p>
              <h3 className="text-3xl font-black text-indigo-950 tracking-tight">
                ₦{totalAmountSpent.toLocaleString()}
              </h3>
              <p className="text-[10px] text-indigo-600 font-bold">Total Amount Invested</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Assets Acquired</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalItemsPurchased}</h3>
              <p className="text-[10px] text-blue-600 font-bold">Items Purchased</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ShoppingBag className="w-7 h-7" />
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Controls & Tab Bar */}
      {isAdmin && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'customers'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Customer Breakdown ({filteredCustomers.length})
            </button>
            <button
              onClick={() => setActiveTab('all-transactions')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'all-transactions'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Master Ledger ({transactionsToProcess.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: All Records</option>
              <option value="paid">Status: Paid & Completed Only</option>
              <option value="pending">Status: Pending & Requests Only</option>
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter customer name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADMIN VIEW: Customer Breakdown Dashboard */}
      {isAdmin && activeTab === 'customers' && (
        <div className="space-y-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((cust) => {
              const isExpanded = expandedCustomer === cust.userId;
              return (
                <div 
                  key={cust.userId} 
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200"
                >
                  {/* Customer Card Summary Header */}
                  <div 
                    onClick={() => setExpandedCustomer(isExpanded ? null : cust.userId)}
                    className="p-6 cursor-pointer bg-white hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 tracking-tight">{cust.name}</h3>
                          {cust.completedOrdersCount > 0 ? (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase">
                              Active Buyer
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold uppercase">
                              Registered User
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {cust.email}</span>
                          {cust.phone !== 'N/A' && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {cust.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Customer Cumulative Financial Stats */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Cumulative Spent</p>
                        <p className="text-lg font-black text-indigo-950">₦{cust.totalSpent.toLocaleString()}</p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Completed Orders</p>
                        <p className="text-base font-black text-slate-900">{cust.completedOrdersCount} orders ({cust.totalItems} items)</p>
                      </div>

                      <button 
                        className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-xl transition-all shrink-0"
                        title={isExpanded ? 'Collapse Purchases' : 'Expand Purchased Items'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Itemized Purchase List for this Customer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-indigo-600" />
                            Everything Bought by {cust.name} ({cust.orders.length} items)
                          </h4>
                          {cust.address !== 'N/A' && (
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Default Delivery: {cust.address}
                            </p>
                          )}
                        </div>

                        {cust.orders.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3">
                            {cust.orders.map((item, idx) => (
                              <div key={item.docId || idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold shrink-0">
                                      {item.siloType ? item.siloType.charAt(0).toUpperCase() : 'P'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                                      <span>Ref: #{item.orderId || item.docId}</span>
                                      {item.sku && <span>• SKU: {item.sku}</span>}
                                      {item.customization?.size && <span>• Size: {item.customization.size}</span>}
                                      {item.customization?.color && <span>• Color: {item.customization.color}</span>}
                                      {item.customization?.nameOnShirt && <span>• Custom Print: "{item.customization.nameOnShirt} #{item.customization.numberOnShirt}"</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  <div className="text-left sm:text-right">
                                    <p className="font-black text-slate-900 text-sm">₦{(item.price || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {new Date(item.orderDate || item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5">
                                    {item.status === 'paid' || item.status === 'completed' ? (
                                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid
                                      </span>
                                    ) : (
                                      <>
                                        <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                                          {item.status === 'payment_submitted' ? 'Payment Submitted' : 'Pending Approval'}
                                        </span>
                                        <span className="text-[9px] text-amber-700 font-bold max-w-[200px] text-right">
                                          We will approve order if payment is confirmed
                                        </span>
                                        {isAdmin && (
                                          <button
                                            onClick={() => handleConfirmPayment(item.docId)}
                                            disabled={confirmingDocId === item.docId}
                                            className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {confirmingDocId === item.docId ? 'Confirming...' : 'Confirm Payment ✓'}
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-bold uppercase">
                            No verified purchases completed by this registered customer yet.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
              <Zap className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching customer records found</p>
            </div>
          )}
        </div>
      )}

      {/* MASTER LEDGER / USER ORDER HISTORY TABLE */}
      {(!isAdmin || activeTab === 'all-transactions') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  {isAdmin ? 'Master Storewide Transactions Ledger' : 'Order History'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing {transactionsToProcess.length} {transactionsToProcess.length === 1 ? 'Record' : 'Records'}
                </p>
              </div>
            </div>
          </div>

          {transactionsToProcess.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-6 py-4">Reference ID</th>
                    <th className="px-6 py-4">Asset Title & Specs</th>
                    {isAdmin && <th className="px-6 py-4">Customer Details</th>}
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transactionsToProcess.map((item, idx) => (
                    <tr key={item.docId || item.orderId || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-slate-900 text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          #{item.orderId || 'TRN-VERIFIED'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                        {item.sku && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU / UTN: {item.sku}</p>
                        )}
                        {item.customization && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {item.customization.size && `Size: ${item.customization.size} `}
                            {item.customization.color && `Color: ${item.customization.color}`}
                          </p>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-900 text-xs">
                            {item.deliveryDetails?.fullName || 'Customer'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {item.deliveryDetails?.email || item.userId || 'N/A'}
                          </p>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.siloType || 'store'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-600 text-[11px]">
                        {new Date(item.orderDate || item.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 text-sm">
                        ₦{(item.price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {item.status === 'paid' || item.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Confirmed
                            </span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                {item.status === 'payment_submitted' ? 'Payment Submitted' : (item.status || 'Pending')}
                              </span>
                              <span className="text-[9px] text-amber-700 font-bold max-w-[180px] text-right">
                                We will approve order if payment is confirmed
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleConfirmPayment(item.docId)}
                                  disabled={confirmingDocId === item.docId}
                                  className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {confirmingDocId === item.docId ? 'Confirming...' : 'Confirm Payment ✓'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">No Transactions Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No orders match the current filter criteria.
                </p>
              </div>
              <button
                onClick={onReturnToStore}
                className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                Explore Store
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
