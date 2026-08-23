import { motion } from 'motion/react';
import { 
  Shirt, 
  Car, 
  Code, 
  Compass, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Award, 
  User, 
  Heart, 
  Sparkles,
  ArrowRight,
  Tv,
  Camera,
  Layers,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useState } from 'react';

export default function AboutUs() {
  const [activeTab, setActiveTab] = useState<'all' | 'textiles' | 'autos' | 'tech'>('all');

  const pillars = [
    {
      id: 'textiles',
      title: 'Uncle Tee Nigeria (Textiles)',
      subtitle: 'The Bedrock of Our Style',
      description: 'The foundation of the entire UTN brand, delivering peerless high-fashion traditional textiles, custom premium tailoring, and contemporary wardrobing to clients who value supreme quality and immaculate craftsmanship.',
      icon: Shirt,
      color: 'from-amber-500 to-orange-600',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      features: ['Premium Premium Fabrics', 'Authentic Wardrobe & Custom Designs', 'Elite Custom Tailoring Tailored to Fit']
    },
    {
      id: 'autos',
      title: 'Uncle Tee Automobiles',
      subtitle: 'Precision on the Asphalt',
      description: 'The premier luxury automotive division of UTN, specializing in the direct procurement, expert mechanical inspection, and transparent transaction of high-performance and reliable vehicles. Trusted globally and locally.',
      icon: Car,
      color: 'from-blue-600 to-indigo-700',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      features: ['Pre-Inspected Quality Fleets', 'Secure Purchase & Escrow Logistics', 'Spectacular Live Auction System']
    },
    {
      id: 'tech',
      title: 'Uncle Tee Tech',
      subtitle: 'Engineering the Next Frontier',
      description: 'Our rapid-response technological and creative powerhouse, dedicated to crafting modern full-stack web applications, custom digital branding, videography, professional photography, and ROI-driven online marketing strategies.',
      icon: Code,
      color: 'from-emerald-500 to-teal-600',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      features: ['Web App Development & DevOps', 'Videography & Dynamic Graphics', 'Result-Driven Online Marketing']
    }
  ];

  const filteredPillars = activeTab === 'all' 
    ? pillars 
    : pillars.filter(p => p.id === activeTab);

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-950 text-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-20 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">UTN GLOBAL LIMITED</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-black italic uppercase tracking-tighter leading-none">
            BORN OF VISION.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-white">ENGINEERED TO EXCEL.</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl leading-relaxed font-medium">
            Formed in 2020 as a premium fashion house, Uncle Tee has evolved into a diversified global enterprise. Today, under the officially registered banner of <span className="text-white font-bold">UTN GLOBAL LIMITED</span>, we innovate across high-end textiles, luxury automobiles, and cutting-edge software technology.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Est. 2020
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Abuja / Nigeria
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> CAC Registered: UTN GLOBAL LTD
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Registration & CAC Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 rounded-[2rem] p-8 sm:p-12 border border-slate-200/60 shadow-sm">
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md">
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">Institutional Trust</h2>
            <p className="text-slate-400 text-xs uppercase font-bold tracking-[0.2em] mt-1">Legitimacy guaranteed</p>
          </div>
        </div>
        
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-4 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
              OFFICIAL REGISTRY
            </div>
            <span className="text-slate-400 text-xs">|</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest">CAC RC Number Verified</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">UTN GLOBAL LIMITED</h3>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Every branch of our operation—whether fashion, motorcars, or technological services—is nested under the legally registered parent conglomerate <span className="text-slate-900 font-bold">UTN GLOBAL LIMITED</span> with the Corporate Affairs Commission (CAC) of the Federal Republic of Nigeria. This corporate framework assures our clients, global stakeholders, and escrow partners of absolute legal transparency, robust financial auditing, and unwavering compliance with federal trade standards.
          </p>
        </div>
      </div>

      {/* Founder Corner Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] p-8 sm:p-16 shadow-xl flex flex-col lg:flex-row gap-12 items-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-slate-50 rounded-full filter blur-3xl pointer-events-none" />
        
        {/* Visual Badge/Avatar Representation */}
        <div className="w-full lg:w-1/3 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 rounded-[2.5rem] opacity-30 group-hover:opacity-70 transition-all duration-300 blur-lg" />
            <div className="relative w-44 h-44 bg-slate-950 rounded-[2.2rem] flex flex-col items-center justify-center border-4 border-white shadow-2xl p-6">
              <User className="w-12 h-12 text-indigo-400 mb-2" />
              <span className="text-white text-base font-black italic tracking-tighter uppercase leading-none">TAHIR</span>
              <span className="text-indigo-300 text-sm font-black italic tracking-tighter uppercase leading-none mt-1">ISMAIL</span>
              <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase mt-3">FOUNDER & CEO</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Tahir Ismail</h4>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">UTN Conglomerate Architect</p>
          </div>
        </div>

        {/* Story Text */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Visionary Leadership</p>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Meet the Founder</h3>
          </div>

          <div className="space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
            <p>
              Driven by an unyielding passion for enterprise, digital transformation, and cultural heritage, <span className="text-slate-900 font-bold">Tahir Ismail</span> is a young, forward-thinking Nigerian entrepreneur in his twenties. Emerging from the vibrant and culturally rich <span className="text-slate-900 font-semibold">Gbagyi tribe</span> and guided by <span className="text-slate-900 font-semibold">devout Islamic values</span> of honesty, ethics, and community contribution, Tahir designed the foundation of UTN Global Limited.
            </p>
            <p>
              Tahir believes that authentic commerce is built on transparent relationships. His spiritual values dictate that transactions must be treated as sacred compacts. This philosophy directly inspired Uncle Tee Automobiles' pristine appraisal systems, Uncle Tee Nigeria's bespoke styling, and Uncle Tee Tech's commitment to high-performance, client-centric engineering.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
              <Bookmark className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-slate-500 italic text-[11px] sm:text-xs">
                "Our registered status under UTN Global Limited is a statement of intent. We do not look for shortcuts. We build real, enduring institutions that connect premium fashion, reliable motorcars, and robust tech software into a coherent ecosystem of trust."
                <span className="block mt-2 font-black uppercase tracking-wider text-[9px] text-slate-800 not-italic">— Tahir Ismail, UTN Global Limited</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The Pillars / Divisions */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-slate-900">Ecosystem Divisions</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Our three pillars of corporate excellence</p>
          </div>
          
          {/* Navigation Tab Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Show All' },
              { id: 'textiles', label: 'Textiles' },
              { id: 'autos', label: 'Automobiles' },
              { id: 'tech', label: 'Tech & Media' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all active:scale-95",
                  activeTab === tab.id
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between hover:border-slate-900 hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="space-y-6">
                  {/* Icon Frame */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300",
                    p.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-2">
                    <span className={cn("px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md border", p.tagColor)}>
                      {p.subtitle}
                    </span>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-indigo-600 transition-colors pt-2">
                      {p.title}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed pt-2">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-8 pt-6 space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Core Services Includes:</h4>
                  <div className="space-y-2">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Core Philosophies */}
      <div className="bg-slate-950 text-white rounded-[2rem] p-8 sm:p-16 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_rgba(255,255,255,0.02),_transparent)]" />
        <div className="absolute bottom-0 left-0 w-92 h-92 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="text-center space-y-2 max-w-xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Our Core Pillars</h2>
          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.3em]">Foundations of UTN Global Limited</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {[
            {
              title: 'Absolute Integrity',
              desc: 'Grounded in our founder’s values, we maintain absolute transparency. There are no hidden fees, structural modifications, or altered logs. What you inspect is exactly what you get.',
              tag: 'SACRED COMPACTS'
            },
            {
              title: 'Supreme Craft',
              desc: 'Whether we are tailoring a luxury cashmere ensemble, verifying high-value engines, or compiling robust lines of software code, we settle for nothing less than world-class precision.',
              tag: 'ELITE STANDARD'
            },
            {
              title: 'Continuous Expansion',
              desc: 'Started as a textile boutique in 2020, our constant drive has propelled us into automobile and tech. We constantly scale our divisions to deliver maximum utility to Africa and the world.',
              tag: 'GLOBAL REACH'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
              <span className="text-[8px] font-mono tracking-widest text-indigo-400 font-bold uppercase">{item.tag}</span>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white">{item.title}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
