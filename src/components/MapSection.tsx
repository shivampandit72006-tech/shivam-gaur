import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Navigation, Globe, ShieldCheck } from 'lucide-react';

export default function MapSection() {
  return (
    <section className="relative py-24 overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest">
                <Globe className="w-3 h-3" />
                Global Presence
              </div>
              <h2 className="text-5xl font-display font-bold leading-tight">
                Operating in the <span className="text-brand">Next Dimension</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Our hyper-local delivery network spans across major metropolitan areas, ensuring your food arrives fresh, fast, and in style.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-3xl space-y-3 border border-white/5 hover:border-brand/30 transition-all group">
                <div className="w-10 h-10 bg-brand/20 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Main Hub</h4>
                <p className="text-xs text-white/40 leading-relaxed">123 Smackers Plaza, Tech District, SF 94103</p>
              </div>

              <div className="glass p-6 rounded-3xl space-y-3 border border-white/5 hover:border-brand/30 transition-all group">
                <div className="w-10 h-10 bg-brand/20 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Contact Us</h4>
                <p className="text-xs text-white/40 leading-relaxed">+1 (555) SMACK-IT<br />support@smackers.io</p>
              </div>

              <div className="glass p-6 rounded-3xl space-y-3 border border-white/5 hover:border-brand/30 transition-all group">
                <div className="w-10 h-10 bg-brand/20 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Service Hours</h4>
                <p className="text-xs text-white/40 leading-relaxed">24/7 Delivery<br />Support: 9AM - 9PM</p>
              </div>

              <div className="glass p-6 rounded-3xl space-y-3 border border-white/5 hover:border-brand/30 transition-all group">
                <div className="w-10 h-10 bg-brand/20 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Safe Delivery</h4>
                <p className="text-xs text-white/40 leading-relaxed">Contactless delivery<br />Certified hygiene</p>
              </div>
            </div>
          </motion.div>

          {/* Map Visualization */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[500px] lg:h-[600px] rounded-[3rem] overflow-hidden glass border border-white/10 shadow-2xl"
          >
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-[#0a0a0a]">
              {/* Grid Lines */}
              <div className="absolute inset-0 opacity-20" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle, #ff3366 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
                }} 
              />
              
              {/* Abstract Map Shapes */}
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 600">
                <path d="M100,100 L200,150 L150,300 L50,250 Z" fill="currentColor" className="text-brand" />
                <path d="M400,50 L550,100 L500,250 L350,200 Z" fill="currentColor" className="text-brand" />
                <path d="M600,300 L750,350 L700,500 L550,450 Z" fill="currentColor" className="text-brand" />
                <path d="M200,400 L350,450 L300,550 L150,500 Z" fill="currentColor" className="text-brand" />
                <circle cx="400" cy="300" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" className="text-brand/30" />
              </svg>

              {/* Service Area Pulse */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/5 rounded-full animate-pulse border border-brand/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/5 rounded-full animate-pulse delay-700 border border-brand/10" />

              {/* Map Markers */}
              <Marker x="30%" y="25%" label="Hub Alpha" />
              <Marker x="70%" y="15%" label="Hub Beta" />
              <Marker x="50%" y="50%" label="Main HQ" active />
              <Marker x="20%" y="70%" label="Hub Gamma" />
              <Marker x="80%" y="75%" label="Hub Delta" />

              {/* Floating Elements */}
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-12 right-12 glass px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">124 Active Deliveries</span>
              </motion.div>

              <div className="absolute bottom-12 left-12 glass p-4 rounded-2xl border border-white/10 space-y-2 shadow-xl">
                <div className="flex items-center gap-2">
                  <Navigation className="w-3 h-3 text-brand" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Live Network</span>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-1 h-4 bg-brand/30 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ height: ['20%', '100%', '20%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-full bg-brand"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Marker({ x, y, label, active = false }: { x: string, y: string, label: string, active?: boolean }) {
  return (
    <motion.div 
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      style={{ left: x, top: y }}
      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
    >
      <div className="relative">
        {active && (
          <div className="absolute inset-0 bg-brand rounded-full animate-ping opacity-40 scale-150" />
        )}
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center border transition-all shadow-xl",
          active 
            ? "bg-brand border-white/20 text-white" 
            : "bg-white/10 backdrop-blur-md border-white/10 text-white/50 group-hover:text-brand group-hover:border-brand/50"
        )}>
          <MapPin className="w-4 h-4" />
        </div>
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-2xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Helper for cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
