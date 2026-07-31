import React, { useState } from 'react';
import { CreditCard, Landmark, Smartphone, CheckCircle2, ShieldCheck, ChevronRight, Copy, Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface PaymentModalProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'transfer' | 'ussd';

export default function PaymentModal({ item, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Method, 2: Process, 3: Success
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate luxury processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Immediately invoke server-side /api/generate-email as soon as gateway returns success:
      const customerEmail = item.deliveryDetails?.email || item.email || '';
      if (customerEmail) {
        fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            to: customerEmail,
            fullName: item.deliveryDetails?.fullName || 'Valued Customer',
            subject: `Order Confirmed - Uncle Tee's Search Engine (#${item.orderId || 'UNKNOWN'})`,
            title: item.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">Order Confirmed • Asset Secured</h2>
                <p>Dear <strong>${item.deliveryDetails?.fullName || 'Valued Client'}</strong>,</p>
                <p>We have successfully verified your transaction for <strong>${item.title}</strong>${item.sku ? ` (SKU: <strong>${item.sku}</strong>)` : ''}. Your order has been securely registered with tracking identifier <strong>#${item.orderId || 'UNKNOWN'}</strong>.</p>
                <p>We are preparing your handcrafted item with absolute precision.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 0.05em;">Post-Purchase Connections</p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 12px;"><a href="https://instagram.com/uncleteeautomobiles" style="color: #c026d3; text-decoration: none; font-weight: bold; font-size: 14px;">📸 Instagram - Automobiles</a></li>
                  <li style="margin-bottom: 12px;"><a href="https://instagram.com/uncleteeee.ng" style="color: #db2777; text-decoration: none; font-weight: bold; font-size: 14px;">🛍️ Instagram - Official Store</a></li>
                  <li style="margin-bottom: 12px;"><a href="https://wa.me/2348138642942" style="color: #10b981; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp VIP Concierge</a></li>
                  <li style="margin-bottom: 12px;"><a href="https://tiktok.com/@uncleteeautos" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px;">🎵 TikTok Collection Showcase</a></li>
                </ul>
              </div>
            `
          })
        }).catch(err => console.error("[PAYMENT GATEWAY CALLBACK ERROR] Failed to invoke /api/generate-email:", err));
      }

      setStep(3);
    }, 2500);
  };

  const finalize = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden font-sans border border-slate-100">
      {/* Header */}
      <div className="bg-slate-950 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] leading-none">Checkout Secure</h3>
            <p className="text-slate-500 text-[9px] mt-1 uppercase font-bold tracking-tighter">Encrypted Transmission Node</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all flex items-center justify-center border border-slate-800"
          title="Close Checkout"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Summary */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Acquiring Asset</span>
                    <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                    {item.customization && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.customization.color && <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-600">COLOR: {item.customization.color}</span>}
                        {item.customization.size && <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-600">SIZE: {item.customization.size}</span>}
                        {item.customization.quantity && item.customization.quantity !== '1' && <span className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-600">QTY: {item.customization.quantity}</span>}
                        {item.customization.name && <span className="text-[9px] bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-600">KIT: {item.customization.name} #{item.customization.number}</span>}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono mt-1">REF: {item.orderId}{item.sku && ` • SKU: ${item.sku}`}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Final Valuation</span>
                    <p className="text-2xl font-black italic text-slate-900 leading-none">₦{item.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Methods */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-2">Select Payment Terminal</label>
                
                <button 
                  onClick={() => setMethod('card')}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between border transition-all h-16",
                    method === 'card' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", method === 'card' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[11px] font-black uppercase text-slate-900 block tracking-wider">Debit / Credit Card</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Visa, Mastercard, Verve</span>
                    </div>
                  </div>
                  {method === 'card' && <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />}
                </button>

                <button 
                  onClick={() => setMethod('transfer')}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center justify-between border transition-all h-16",
                    method === 'transfer' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", method === 'transfer' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-[11px] font-black uppercase text-slate-900 block tracking-wider">Bank Transfer</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Instant Verification Settlement</span>
                    </div>
                  </div>
                  {method === 'transfer' && <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />}
                </button>

                <button 
                   onClick={() => setMethod('ussd')}
                   className={cn(
                     "w-full p-4 rounded-2xl flex items-center justify-between border transition-all h-16",
                     method === 'ussd' ? "bg-indigo-50 border-indigo-600 shadow-sm" : "bg-white border-slate-100 hover:border-slate-300"
                   )}
                 >
                   <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl", method === 'ussd' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                     <div className="text-left">
                       <span className="text-[11px] font-black uppercase text-slate-900 block tracking-wider">USSD Code</span>
                       <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Dial code on your mobile device</span>
                     </div>
                   </div>
                   {method === 'ussd' && <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />}
                 </button>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Proceed to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {method === 'transfer' ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">Acquire via Transfer</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Luxury Assets Require Verified Liquidity</p>
                  </div>
                  
                  <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Landmark className="w-32 h-32" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Bank Institution</span>
                        <p className="text-lg font-bold">Kuda Bank</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Account Identifier</span>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-mono font-bold tracking-wider">2019667940</p>
                          <button className="text-indigo-400 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div>
                         <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Account Title</span>
                         <p className="text-sm font-bold">(uncle tee nigeria)Tahir ismail</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight">System automatically detects payment upon transmission</p>
                  </div>

                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 text-white p-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all hover:bg-slate-900 disabled:opacity-50"
                  >
                    {isProcessing ? "Verifying Transaction..." : "I Have Made the Transfer"}
                  </button>
                </div>
              ) : (
                <div className="py-12 space-y-8 text-center">
                   <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto relative">
                      <CreditCard className="w-8 h-8 text-indigo-600" />
                      <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-full border-t-indigo-600 animate-spin" />
                   </div>
                   <div>
                     <h4 className="text-xl font-bold text-slate-900 tracking-tight">Initializing Gateway</h4>
                     <p className="text-xs text-slate-500 mt-2">Connecting to Secure {method.toUpperCase()} Node...</p>
                   </div>
                   <button 
                    onClick={handlePayment}
                    className="text-xs font-black uppercase text-indigo-600 tracking-widest hover:underline"
                   >
                     Trigger Test Success
                   </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-100">
                <CheckCircle2 className="w-12 h-12 text-amber-500" />
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl font-light italic text-slate-900 tracking-tight">Payment Submitted</h4>
                <p className="text-[11px] text-amber-700 font-bold uppercase tracking-[0.15em] max-w-[300px] mx-auto leading-relaxed bg-amber-50/80 p-3 rounded-xl border border-amber-200">
                  We will approve order if payment is confirmed
                </p>
                <p className="text-[10px] text-slate-500 font-medium max-w-[260px] mx-auto leading-relaxed">
                  Uncle Tee has documented your acquisition details. Admin confirmation is pending.
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                <p className="text-[10px] font-mono font-bold text-slate-600 tracking-tighter">TRANS_ID: SUBMITTED_{Math.random().toString(36).substring(7).toUpperCase()}</p>
              </div>

              <button 
                onClick={finalize}
                className="w-full bg-slate-900 text-white p-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl"
              >
                Close & Return to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5 grayscale opacity-50">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">PCI-DSS COMPLIANT</span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5 grayscale opacity-50">
          <Landmark className="w-3.5 h-3.5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">ELITE VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
