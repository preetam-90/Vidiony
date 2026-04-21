import Link from "next/link";
import { Metadata } from "next";
import { Shield, Copyright, AlertTriangle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - Vidiony",
  description: "Vidiony Terms of Service - Rules and guidelines for using our platform",
};

function CloudPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none text-red-100" xmlns="http://www.w3.org/2000/svg">
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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 overflow-hidden font-sans relative">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-lantern {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
      `}} />
      
      {/* Universal Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CloudPattern />
        {/* Soft top-center lantern glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.12)_0%,rgba(180,83,9,0.05)_40%,transparent_70%)] animate-[pulse-lantern_8s_ease-in-out_infinite]" />
      </div>

      <div className="container relative mx-auto px-4 py-16 z-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16 flex flex-col items-center">
            {/* Chinese Seal Motif */}
            <div className="flex h-16 w-16 items-center justify-center border-2 border-red-700 bg-red-950/40 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.25)] mb-8" style={{ borderRadius: '4px' }}>
              <span className="font-serif font-bold text-3xl tracking-tighter">V</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-red-600 uppercase">
              Terms of Service
            </h1>
            <p className="text-sm tracking-widest text-slate-500 uppercase">
              Last updated: April 2026
            </p>
          </div>

          <div className="relative p-8 sm:p-12 md:p-16 rounded-lg border border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl">
            {/* Decorative lattice corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-red-800/40 opacity-70 pointer-events-none">
              <div className="absolute top-2 left-2 w-10 h-10 border-t border-l border-amber-600/30" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-red-800/40 opacity-70 pointer-events-none">
              <div className="absolute top-2 right-2 w-10 h-10 border-t border-r border-amber-600/30" />
            </div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-red-800/40 opacity-70 pointer-events-none">
              <div className="absolute bottom-2 left-2 w-10 h-10 border-b border-l border-amber-600/30" />
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-red-800/40 opacity-70 pointer-events-none">
              <div className="absolute bottom-2 right-2 w-10 h-10 border-b border-r border-amber-600/30" />
            </div>

            <div className="space-y-10 relative z-10">
              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>1. Acceptance of Terms</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p>
                    By accessing and using Vidiony, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by these terms, please do not use this service.
                  </p>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>2. User Conduct Guidelines</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p className="mb-4">
                    You agree to use Vidiony responsibly and not to:
                  </p>
                  <ul className="space-y-3 list-none sm:pl-4">
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Post content that is illegal, harmful, threatening, or offensive</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Violate any intellectual property rights of others</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Attempt to gain unauthorized access to any part of the platform</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Interfere with the proper operation of the service</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Upload viruses or malicious code</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Engage in any activity that could harm minors</li>
                  </ul>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <Copyright className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>3. Content & Intellectual Property</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p className="mb-4">
                    All content on Vidiony is protected by copyright law. You retain ownership of content you upload 
                    but grant us a license to display and distribute it on our platform.
                  </p>
                  <ul className="space-y-3 list-none sm:pl-4">
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> You must own or have rights to content you upload</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> You cannot use others' content without permission</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> We may remove content that violates these terms</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Repeated violations may result in account termination</li>
                  </ul>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <span className="w-5 h-5 flex flex-shrink-0 items-center justify-center text-red-500 font-serif text-lg">四</span>
                  <span>4. Account Responsibilities</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p className="mb-4">
                    You are responsible for:
                  </p>
                  <ul className="space-y-3 list-none sm:pl-4">
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Maintaining the security of your account</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> All activities that occur under your account</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Providing accurate and complete information</li>
                    <li className="flex items-start gap-3"><span className="text-red-800 mt-1">▪</span> Notifying us immediately of any security breaches</li>
                  </ul>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <span className="w-5 h-5 flex flex-shrink-0 items-center justify-center text-red-500 font-serif text-lg">五</span>
                  <span>5. Limitation of Liability</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p>
                    Vidiony is provided "as is" without any warranties. We do not guarantee the accuracy, reliability, 
                    or availability of the service. In no event shall we be liable for any indirect, incidental, 
                    or consequential damages arising from your use of the platform.
                  </p>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <span className="w-5 h-5 flex flex-shrink-0 items-center justify-center text-red-500 font-serif text-lg">六</span>
                  <span>6. Termination</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p>
                    We reserve the right to terminate or suspend your account at any time for violation of these 
                    terms or for any other reason at our sole discretion. You may also delete your account at any time.
                  </p>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <span className="w-5 h-5 flex flex-shrink-0 items-center justify-center text-red-500 font-serif text-lg">七</span>
                  <span>7. Changes to Terms</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p>
                    We may update these terms from time to time. We will notify you of significant changes via email 
                    or through the platform. Your continued use after such changes constitutes acceptance of the new terms.
                  </p>
                </div>
              </section>

              <LatticeDivider />

              <section>
                <h2 className="text-lg sm:text-xl tracking-widest text-amber-500/90 font-medium mb-6 flex items-center gap-4 uppercase">
                  <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>8. Contact Information</span>
                </h2>
                <div className="text-slate-400 font-light leading-loose tracking-wide">
                  <p className="mb-4">
                    If you have questions about these terms, please contact us:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 flex-shrink-0 rotate-45 border border-amber-500 bg-amber-500/20" />
                    <a href="mailto:legal@vidiony.com" className="text-amber-600 hover:text-amber-400 transition-colors underline decoration-amber-900/50 underline-offset-4">
                      legal@vidiony.com
                    </a>
                  </div>
                </div>
              </section>
            </div>

            {/* Acknowledgement footer inside card */}
            <div className="mt-16 pt-8 border-t border-red-950/40 text-center relative z-10">
              <p className="text-xs sm:text-sm tracking-widest text-slate-500 uppercase">
                By using Vidiony, you acknowledge that you have read and agree to these terms.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative py-12 border-t border-red-950/40 z-10 bg-[#030303]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs tracking-widest uppercase text-slate-500 font-medium">
            <Link href="/about" className="hover:text-amber-500 transition-colors">About</Link>
            <span className="text-red-900/40">·</span>
            <Link href="/help" className="hover:text-amber-500 transition-colors">Help</Link>
            <span className="text-red-900/40">·</span>
            <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy</Link>
          </div>
          <p className="text-center text-xs tracking-widest text-slate-600 uppercase mt-8 font-light">
            © 2026 Vidiony. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
