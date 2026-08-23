import { motion } from 'motion/react';
import { Instagram, MessageCircle, Music2, Sparkles, X, Heart } from 'lucide-react';

interface SocialFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialFunnelModal({ isOpen, onClose }: SocialFunnelModalProps) {
  if (!isOpen) return null;

  const links = [
    { 
      name: 'Instagram Automobiles', 
      desc: 'Exclusive Niger-Delta supercar catalogs & updates',
      href: 'https://instagram.com/uncleteeautomobiles', 
      icon: Instagram, 
      color: 'from-fuchsia-600 to-pink-500',
      badge: '@uncleteeautomobiles'
    },
    { 
      name: 'Official Instagram Boutique', 
      desc: 'Premium footwear, watches & luxury active apparel',
      href: 'https://instagram.com/uncleteeee.ng', 
      icon: Instagram, 
      color: 'from-pink-500 to-rose-500',
      badge: '@uncleteeee.ng'
    },
    { 
      name: 'VIP WhatsApp Concierge', 
      desc: 'Direct order customization & 24/7 personal support',
      href: 'https://wa.me/2348138642942', 
      icon: MessageCircle, 
      color: 'from-emerald-500 to-green-600',
      badge: 'Connect Live'
    },
    { 
      name: 'TikTok Showcase', 
      desc: 'Immersive lookbooks & behind-the-scenes reviews',
      href: 'https://tiktok.com/@uncleteeautos', 
      icon: Music2, 
      color: 'from-slate-900 to-indigo-950',
      badge: '@uncleteeautos'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 md:p-10"
      >
        {/* Abstract background gradient accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl -z-10" />

        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
          title="Dismiss Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4 text-indigo-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Transaction Secured</h2>
          <p className="text-sm text-slate-500 font-medium">
            Join the inner circle of Uncle Tee’s high-achievers. Choose your connection channel below.
          </p>
        </div>

        <div className="space-y-4">
          {links.map((link, idx) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all text-left group"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${link.color} text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {link.name}
                    </h3>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-2 py-0.5 bg-white border border-slate-100 rounded-full">
                      {link.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{link.desc}</p>
                </div>
              </motion.a>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Authenticity At Its Peak</span>
        </div>
      </motion.div>
    </div>
  );
}
