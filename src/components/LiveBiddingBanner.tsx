import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Gavel, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveBiddingBannerProps {
  onJoinBidding: () => void;
}

export function LiveBiddingBanner({ onJoinBidding }: LiveBiddingBannerProps) {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep time ticking to filter concluded auctions immediately
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setActiveAuctions(list);
    }, (err) => {
      console.warn("[LIVE BANNER SNAPSHOT ERROR]:", err);
    });

    return () => unsubscribe();
  }, []);

  // Filter for auctions currently in progress
  const ongoingAuctions = activeAuctions.filter(auction => {
    if (auction.status !== 'active') return false;
    const end = new Date(auction.endTime);
    return end.getTime() > currentTime.getTime();
  });

  if (ongoingAuctions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8 overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 relative text-left shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-300/40">
                🔨 LIVE AUCTION
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">
                Engine Standby Mode
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                Real-Time High-Velocity Vehicle Auctions
              </h2>
              <p className="text-xs text-slate-500 font-sans max-w-2xl">
                Bid on accident & non-accident distress sales cars in Nigeria with genuine custom duties at affordable rates. Open the portal to view live vehicles, fund your escrow wallet, or list cars for auction!
              </p>
            </div>
          </div>
          <button
            onClick={onJoinBidding}
            className="flex items-center gap-2.5 px-5 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm shrink-0 font-sans hover:-translate-y-0.5"
          >
            <Gavel className="w-4 h-4 text-amber-400" />
            <span>Open Bidding Portal</span>
          </button>
        </div>
      </motion.div>
    );
  }

  // Showcase the first (or most active) ongoing auction
  const featured = ongoingAuctions[0];
  const formattedBid = featured.currentBid?.toLocaleString() || featured.startPrice?.toLocaleString() || '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8 overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-amber-500/5 to-slate-900/10 backdrop-blur-md p-6 relative shadow-xl shadow-red-500/5 text-left"
    >
      {/* Decorative pulse glow in the corner */}
      <span className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
        <div className="space-y-3">
          {/* Flashing Live Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse border border-red-400/40">
              <span className="h-2 w-2 rounded-full bg-white block" />
              LIVE AUCTION
            </span>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> スペクテイター Spectator Mode Active
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              Ongoing Liquidation Bid: <span className="font-light italic text-indigo-650">{featured.title}</span>
            </h2>
            <p className="text-xs text-slate-500 font-sans max-w-2xl">
              An active corporate asset liquidation auction is running right now. Even without credit, feel free to spectate the intense real-time bidding action live, or fund your Bid Escrow Wallet to place active bids!
            </p>
          </div>

          {/* Current Leading Stats */}
          <div className="flex items-center gap-6 pt-1 font-mono text-sm">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">LEADING LIVE BID</span>
              <span className="text-lg font-black text-red-600">₦{formattedBid} NGN</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">LEADER</span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                {featured.highestBidderName ? `${featured.highestBidderName} 👑` : "Awaiting Bidder"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button to Spectate */}
        <button
          onClick={onJoinBidding}
          className="group flex items-center gap-3 px-6 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/10 transition-all font-sans hover:-translate-y-0.5"
        >
          <Gavel className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>SPECTATE LIVE BID ➔</span>
        </button>
      </div>
    </motion.div>
  );
}
