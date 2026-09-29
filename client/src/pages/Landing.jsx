// ============================================
// Landing Page - SaaS Design
// ============================================
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Brain, FileText, BookOpen,
  Bell, BarChart3, ArrowRight, Shield, Users
} from 'lucide-react';

import heroDashboardImg from '../assets/hero-dashboard.png';

const features = [
  { icon: LayoutDashboard, title: 'TNP Drive Management', desc: 'Centralized college placement drives, automated eligibility filtering, and one-click applications.' },
  { icon: Brain, title: 'AI ATS Resume Scanner', desc: 'Scan your resume against drive requirements, ATS match scores, missing keywords, and STAR improvements.' },
  { icon: FileText, title: 'Targeted Resume Manager', desc: 'Maintain multiple role-targeted resumes and attach them directly to campus placement drives.' },
  { icon: BookOpen, title: 'Campus Experience Portal', desc: 'Browse and share real interview experiences, round breakdowns, and placement advice from seniors.' },
  { icon: Shield, title: 'Permission & Status Authority', desc: 'TNP-controlled application permissions with real-time shortlisting, selection, and rejection updates.' },
  { icon: BarChart3, title: 'College Placement Analytics', desc: 'Track overall placement percentages, company-wise conversion rates, CTC brackets, and placement records.' },
];

const stats = [
  { value: '500+', label: 'Active Students', icon: Users },
  { value: '2,000+', label: 'Applications Tracked', icon: FileText },
  { value: '85%', label: 'Success Rate', icon: BarChart3 },
  { value: '50+', label: 'Partner Companies', icon: Shield },
];

export default function Landing() {
  return (
    <div className="w-full min-h-screen bg-black text-[#ededed] font-sans selection:bg-white selection:text-black overflow-x-hidden relative">
      
      {/* ===== Background Pattern ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center">
        <div className="absolute top-0 w-full h-[600px] opacity-40" style={{ background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.15), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ===== Navbar ===== */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#333] bg-gradient-to-b from-[#1a1a1a] to-black">
            <span className="text-white font-bold text-sm">CF</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">CareerFlow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-[#888] hover:text-white transition-colors">Log in</Link>
          <Link to="/signup" className="px-4 py-2 rounded-lg text-sm font-medium text-black bg-[#ededed] hover:scale-105 active:scale-95 transition-transform">
            Sign up
          </Link>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 text-center flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="w-full">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 border border-white/10 bg-white/5 backdrop-blur-md mx-auto">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide uppercase text-gray-300">v2.0 Now Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight mx-auto max-w-4xl">
            Your placement journey,<br className="hidden md:block" />
            beautifully organized.
          </h1>

          <p className="text-lg md:text-xl text-[#888] max-w-2xl mx-auto mb-10 leading-relaxed px-4">
            CareerFlow replaces chaotic spreadsheets with a centralized, AI-powered system designed exclusively for engineering students.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4">
            <Link to="/signup" className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium text-black bg-[#ededed] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform">
              Start for free <ArrowRight size={16} />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium border border-[#333] text-[#ededed] hover:bg-white/5 transition-colors text-center">
              View features
            </a>
          </div>
        </motion.div>

        {/* Hero Dashboard Preview Image */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-16 sm:mt-24 w-full relative max-w-5xl mx-auto px-4"
        >
          <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-2 shadow-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
            <img 
              src={heroDashboardImg} 
              alt="CareerFlow Dashboard Preview" 
              className="w-full h-auto rounded-lg border border-[#222] object-cover block"
            />
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} 
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 border-t border-b border-[#222] py-10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center flex flex-col items-center justify-center">
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">{stat.value}</h3>
              <p className="text-xs tracking-wider uppercase font-medium text-[#666]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-4">Everything you need.</h2>
          <p className="text-lg text-[#888] max-w-2xl">A complete suite of tools to manage applications, analyze job descriptions, and prepare for interviews.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-[#222] bg-[#0a0a0a] hover:border-[#444] transition-colors group">
              <feature.icon size={24} className="mb-4 text-[#888] group-hover:text-white transition-colors" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#888] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="relative z-10 py-32 border-t border-[#111] bg-gradient-to-b from-transparent to-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Take control of your placements.</h2>
          <p className="text-lg text-[#888] mb-10">Join thousands of students landing top-tier engineering roles.</p>
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-medium text-black bg-[#ededed] hover:scale-105 active:scale-95 transition-transform text-lg w-full sm:w-auto">
            Get started <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 py-10 px-6 border-t border-[#222] bg-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center border border-[#333] bg-gradient-to-b from-[#1a1a1a] to-black">
              <span className="text-white font-bold text-[10px]">CF</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">CareerFlow</span>
          </div>
          <p className="text-sm font-medium text-[#666]">
            © {new Date().getFullYear()} CareerFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
