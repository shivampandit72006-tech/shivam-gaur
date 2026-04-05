import React from 'react';
import { motion } from 'motion/react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, ArrowUpRight, Globe, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-24 pb-12 overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur-3xl">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand/5 blur-[120px] rounded-full translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-3xl font-display font-black tracking-tighter text-white">SMACKERS</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Redefining the art of food delivery through hyper-local logistics and next-gen technology. Experience the future of dining.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={Facebook} />
              <SocialIcon icon={Twitter} />
              <SocialIcon icon={Instagram} />
              <SocialIcon icon={Youtube} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Explore</h4>
            <ul className="space-y-4">
              <FooterLink label="Popular Restaurants" />
              <FooterLink label="Our Menu" />
              <FooterLink label="Special Offers" />
              <FooterLink label="Smackers Rewards" />
              <FooterLink label="Gift Cards" />
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Support</h4>
            <ul className="space-y-4">
              <FooterLink label="Help Center" />
              <FooterLink label="Track Order" />
              <FooterLink label="Privacy Policy" />
              <FooterLink label="Terms of Service" />
              <FooterLink label="Become a Partner" />
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Newsletter</h4>
            <p className="text-white/40 text-sm leading-relaxed">
              Subscribe to get the latest updates and exclusive offers delivered to your inbox.
            </p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-brand outline-none transition-all pr-12"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20 hover:scale-105 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/30">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              English (US)
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Secure Payments
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Hyper-Local
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
              &copy; {currentYear} SMACKERS LOGISTICS INC. ALL RIGHTS RESERVED.
            </p>
            <p className="text-white/10 text-[8px] mt-2 uppercase tracking-widest">
              Crafted for a new dimension of food delivery.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ icon: Icon }: { icon: any }) {
  return (
    <motion.a 
      whileHover={{ y: -4, scale: 1.1 }}
      href="#"
      className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-brand hover:border-brand/30 transition-all shadow-lg"
    >
      <Icon className="w-5 h-5" />
    </motion.a>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <li>
      <a href="#" className="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-2 group">
        <div className="w-1.5 h-1.5 rounded-full bg-brand scale-0 group-hover:scale-100 transition-transform" />
        {label}
      </a>
    </li>
  );
}
