import Link from "next/link";
import { Metadata } from "next";
import { Shield, Lock, Eye, Cookie, Database, Mail, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - Vidiony",
  description: "Vidiony Privacy Policy - How we collect, use, and protect your data",
};

function CloudPattern() {
  return (
    <svg className="fixed inset-0 w-full h-full opacity-[0.04] pointer-events-none text-red-100 z-0" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="chinese-cloud" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <path d="M30 40c0-11 9-20 20-20s20 9 20 20c11 0 20 9 20 20s-9 20-20 20H30c-11 0-20-9-20-20s9-20 20-20z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M50 40c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#chinese-cloud)" />
    </svg>
  );
}

function LatticeDivider() {
  return (
    <div className="flex items-center justify-center w-full my-12 opacity-60">
      <div className="h-px bg-gradient-to-r from-transparent via-red-800 to-transparent flex-1" />
      <div className="mx-4 flex gap-1.5">
        <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
        <div className="w-2 h-2 rotate-45 border border-amber-500 bg-amber-500/20" />
        <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
      </div>
      <div className="h-px bg-gradient-to-r from-red-800 via-transparent to-transparent flex-1" />
    </div>
  );
}

const policySections = [
  {
    icon: Shield,
    title: "Data We Collect",
    description: "Information you provide and how we use it",
    content: "We collect information you provide directly (name, email, profile), usage data (watch history, interactions), device information, and cookies. This helps us improve your experience and provide personalized content.",
  },
  {
    icon: Lock,
    title: "How We Use Your Data",
    description: "Purpose and legal basis for processing",
    content: "Your data enables core features (account management, video delivery), personalization (recommendations), communication (updates, support), and analytics (improving our service). We process data based on consent and legitimate interest.",
  },
  {
    icon: Eye,
    title: "Data Sharing",
    description: "When and how we share information",
    content: "We share data with service providers who help operate our platform, comply with legal requests, and in aggregate/anonymized form for analytics. We never sell your personal data to third parties.",
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    description: "Technologies we use",
    content: "We use essential cookies for functionality, analytics cookies to understand usage, and marketing cookies (with consent). You can manage cookie preferences in your browser settings.",
  },
  {
    icon: Database,
    title: "Data Retention",
    description: "How long we keep your information",
    content: "Account data is retained while active and for 30 days after deletion. Usage data is retained for up to 2 years. Legal requirements may require longer retention in specific cases.",
  },
  {
    icon: Lock,
    title: "Your Rights",
    description: "Control over your data",
    content: "You can access, correct, or delete your data anytime. You can export your data, object to processing, and request data deletion. Contact privacy@vidiony.com for any requests.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 overflow-hidden font-sans relative">
      <CloudPattern />
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.08)_0%,rgba(180,83,9,0.03)_40%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom_left,rgba(220,38,38,0.05)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.03)_0%,transparent_60%)]" />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="flex h-16 w-16 items-center justify-center border-2 border-red-700 bg-red-950/40 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)] mx-auto mb-8 rounded-[4px]">
            <span className="font-serif font-bold text-3xl tracking-tighter">V</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-red-600 uppercase mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg tracking-wide text-slate-400 font-light mt-6">
            Your privacy is important to us. This policy explains how we handle your data.
          </p>
          <p className="text-xs tracking-[0.2em] text-red-500/70 mt-4 uppercase">
            Last updated: April 2026
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {policySections.map((section) => (
            <div
              key={section.title}
              className="relative p-8 lg:p-10 rounded-sm overflow-hidden border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl group transition-all duration-500 hover:border-red-500/40 hover:bg-[#120a0a]/90 hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-red-800/40 opacity-70 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:border-amber-600/50">
                <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t border-l border-amber-600/30 group-hover:border-red-500/40" />
              </div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-red-800/40 opacity-70 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:border-amber-600/50">
                <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t border-r border-amber-600/30 group-hover:border-red-500/40" />
              </div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-red-800/40 opacity-70 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:border-amber-600/50">
                <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b border-l border-amber-600/30 group-hover:border-red-500/40" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-red-800/40 opacity-70 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:border-amber-600/50">
                <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b border-r border-amber-600/30 group-hover:border-red-500/40" />
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                <div className="w-14 h-14 rounded-sm border border-red-900/50 bg-gradient-to-br from-red-950/40 to-[#050202] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.1)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.25)] group-hover:border-red-700/50 transition-all duration-500">
                  <section.icon className="w-6 h-6 text-amber-500/90 group-hover:text-amber-400 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-serif tracking-[0.05em] text-slate-200 mb-2 group-hover:text-red-100 transition-colors">{section.title}</h2>
                  <p className="text-[0.75rem] tracking-[0.15em] uppercase text-red-500/80 mb-4 font-medium">{section.description}</p>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{section.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <LatticeDivider />

        <div className="max-w-4xl mx-auto space-y-8 mb-16">
          <div className="relative p-8 rounded-sm border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-800/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-800/40" />
            
            <h2 className="text-2xl font-serif tracking-[0.05em] text-slate-200 mb-6">Children's Privacy</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Vidiony is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected data from a child, please contact us 
              immediately at privacy@vidiony.com and we will delete it.
            </p>
          </div>

          <div className="relative p-8 rounded-sm border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-800/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-800/40" />
            
            <h2 className="text-2xl font-serif tracking-[0.05em] text-slate-200 mb-6">International Data Transfers</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Your data may be transferred and processed in countries outside your residence. We ensure 
              appropriate safeguards (Standard Contractual Clauses, adequacy decisions) are in place 
              for such transfers in compliance with applicable data protection laws.
            </p>
          </div>

          <div className="relative p-8 rounded-sm border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-800/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-800/40" />
            
            <h2 className="text-2xl font-serif tracking-[0.05em] text-slate-200 mb-6">Security Measures</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              We implement industry-standard security measures including encryption (TLS/SSL), secure 
              storage, access controls, and regular security audits. While no system is 100% secure, 
              we work hard to protect your data.
            </p>
          </div>

          <div className="relative p-8 rounded-sm border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-800/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-800/40" />
            
            <h2 className="text-2xl font-serif tracking-[0.05em] text-slate-200 mb-6">Changes to This Policy</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              We may update this policy periodically. For significant changes, we'll notify you via email 
              or a prominent notice on the platform. The "Last updated" date at the top indicates when 
              changes take effect.
            </p>
          </div>

          <div className="relative p-10 rounded-sm border border-red-800/50 bg-gradient-to-b from-[#0f0505]/90 to-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-700/50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-700/50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-700/50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-700/50" />
            
            <h2 className="text-3xl font-serif tracking-[0.05em] text-amber-50 mb-6 text-center">Contact Us</h2>
            <p className="text-sm tracking-wide text-slate-400 font-light mb-8 text-center max-w-lg mx-auto">
              For privacy-related questions or to exercise your rights, please reach out to our privacy team:
            </p>
            <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <a 
                href="mailto:privacy@vidiony.com" 
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded border border-red-900/30 bg-black/40 hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 text-center"
              >
                <Mail className="w-6 h-6 text-red-500 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm tracking-wide text-slate-300 group-hover:text-amber-100">Email Us</span>
              </a>
              <Link 
                href="/help" 
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded border border-red-900/30 bg-black/40 hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 text-center"
              >
                <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center group-hover:border-amber-500 transition-colors">
                  <span className="text-red-500 text-xs font-bold group-hover:text-amber-500">?</span>
                </div>
                <span className="text-sm tracking-wide text-slate-300 group-hover:text-amber-100">Help Center</span>
              </Link>
              <Link 
                href="/settings/privacy" 
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded border border-red-900/30 bg-black/40 hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 text-center"
              >
                <Shield className="w-6 h-6 text-red-500 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm tracking-wide text-slate-300 group-hover:text-amber-100">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 py-12 border-t border-red-950/40 bg-[#050303]/80">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex h-10 w-10 items-center justify-center border border-red-800 bg-red-950/30 text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)] rounded-[3px]">
              <span className="font-serif font-bold text-lg tracking-tighter">V</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-[0.75rem] tracking-[0.2em] text-slate-500 uppercase">
              <Link href="/about" className="hover:text-amber-500 transition-colors">About</Link>
              <Link href="/help" className="hover:text-amber-500 transition-colors">Help</Link>
              <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms</Link>
            </div>
            <p className="text-center text-[0.7rem] tracking-widest text-slate-600 mt-4 uppercase">
              © 2026 Vidiony. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
