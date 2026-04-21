import Link from "next/link";
import { Metadata } from "next";
import { Play, Zap, Users, Globe, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About - Vidiony",
  description: "Learn about Vidiony - the next-generation video sharing platform",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-slate-200 overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes pulse-lantern {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
      `}} />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none text-red-100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="chinese-cloud" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M30 40c0-11 9-20 20-20s20 9 20 20c11 0 20 9 20 20s-9 20-20 20H30c-11 0-20-9-20-20s9-20 20-20z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M50 40c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#chinese-cloud)" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,rgba(180,83,9,0.05)_40%,transparent_70%)] animate-[pulse-lantern_8s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10">
        <section className="relative py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="relative mb-12">
                <div className="flex h-24 w-24 items-center justify-center border-2 border-red-700 bg-red-950/40 text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.2)]" style={{ borderRadius: '4px' }}>
                  <span className="font-serif font-bold text-5xl tracking-tighter">V</span>
                </div>
                <div className="absolute -inset-2 rounded bg-gradient-to-br from-red-600/30 to-amber-600/30 blur-xl -z-10 animate-[pulse-lantern_4s_ease-in-out_infinite]" />
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-[0.3em] uppercase mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-red-600">
                  Vidiony
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-400 font-light tracking-wide max-w-2xl mb-12">
                The next-generation video platform built for creators who dream bigger.
              </p>
              
              <div className="flex gap-6">
                <Button asChild size="lg" className="bg-gradient-to-b from-red-800 to-red-950 hover:from-red-700 hover:to-red-900 text-amber-50 border border-red-700/50 shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] tracking-widest uppercase transition-all duration-300">
                  <Link href="/explore">
                    Explore Videos <ArrowRight className="ml-3 w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="bg-[#0a0a0a]/50 backdrop-blur-sm border-red-900/60 hover:border-red-500/50 text-slate-300 hover:text-amber-100 tracking-widest uppercase transition-all duration-300">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-24">
              {[
                { label: "Videos", value: "1M+" },
                { label: "Creators", value: "50K+" },
                { label: "Daily Views", value: "10M+" },
                { label: "Countries", value: "180+" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="relative text-center p-8 border border-red-900/30 bg-[#0a0a0a]/60 backdrop-blur-xl group overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-red-800/40 opacity-70" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-red-800/40 opacity-70" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-red-800/40 opacity-70" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-red-800/40 opacity-70" />
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 text-3xl lg:text-4xl font-serif font-bold text-amber-500 mb-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">{stat.value}</div>
                  <div className="relative z-10 text-sm tracking-[0.2em] uppercase text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center w-full mb-16 opacity-60">
              <div className="h-px bg-gradient-to-r from-transparent via-red-800 to-transparent flex-1 max-w-md" />
              <div className="mx-4 flex gap-1.5">
                <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
                <div className="w-2 h-2 rotate-45 border border-amber-500 bg-amber-500/20" />
                <div className="w-1.5 h-1.5 rotate-45 border border-red-500" />
              </div>
              <div className="h-px bg-gradient-to-r from-red-800 via-transparent to-transparent flex-1 max-w-md" />
            </div>

            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-[0.2em] uppercase text-slate-200 mb-10">Our Mission</h2>
              <p className="text-lg text-slate-400 font-light leading-relaxed mb-8 tracking-wide">
                We believe video is the most powerful medium for human connection. 
                Vidiony exists to democratize video creation and sharing — giving every creator, 
                regardless of resources or background, a platform to share their story with the world.
              </p>
              <p className="text-lg text-slate-400 font-light leading-relaxed tracking-wide">
                Built with cutting-edge technology, designed with creator-first thinking, 
                and powered by a community that values authenticity over algorithms.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-[0.2em] uppercase text-center text-slate-200 mb-16">What We Believe</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Speed",
                  description: "Lightning-fast performance that keeps up with your ideas",
                },
                {
                  icon: Users,
                  title: "Community",
                  description: "Build genuine connections with viewers who care",
                },
                {
                  icon: Globe,
                  title: "Global Reach",
                  description: "Share your content with the entire world",
                },
                {
                  icon: Heart,
                  title: "Authenticity",
                  description: "Your voice matters more than follower counts",
                },
              ].map((value) => (
                <div
                  key={value.title}
                  className="group relative p-10 border border-red-900/30 bg-[#0a0a0a]/60 backdrop-blur-xl hover:bg-[#120a0a]/80 transition-all duration-500 hover:border-red-500/40 hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-red-800/40 opacity-70 group-hover:border-amber-600/50 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-red-800/40 opacity-70 group-hover:border-amber-600/50 transition-colors" />
                  
                  <div className="w-14 h-14 border border-red-800/40 bg-red-950/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 group-hover:border-amber-500/30 group-hover:bg-amber-950/20 group-hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]" style={{ borderRadius: '2px' }}>
                    <value.icon className="w-6 h-6 text-amber-500/80 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-lg tracking-[0.1em] uppercase font-medium text-slate-200 mb-4">{value.title}</h3>
                  <p className="text-sm font-light tracking-wide text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-[0.2em] uppercase text-center text-slate-200 mb-8">The Team</h2>
              <p className="text-lg text-slate-400 font-light tracking-wide text-center leading-relaxed mb-16 max-w-2xl mx-auto">
                Vidiony is built by a small, passionate team of engineers, designers, 
                and creators who believe in the power of video to change how we connect.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Engineers", role: "Building the future", icon: "⬡" },
                  { name: "Designers", role: "Crafting experiences", icon: "◈" },
                  { name: "Creators", role: "Inspiring the community", icon: "⟡" },
                ].map((member) => (
                  <div
                    key={member.name}
                    className="group relative text-center p-10 border border-red-900/30 bg-[#0a0a0a]/60 backdrop-blur-xl"
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-red-800/40 opacity-70" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-red-800/40 opacity-70" />
                    
                    <div className="text-5xl mb-6 text-amber-700 font-serif group-hover:text-amber-500 transition-colors duration-500 drop-shadow-[0_0_10px_rgba(217,119,6,0.2)]">{member.icon}</div>
                    <h3 className="text-lg tracking-[0.1em] uppercase font-medium text-slate-200 mb-2">{member.name}</h3>
                    <p className="text-sm font-light tracking-wide text-slate-400">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto relative p-12 lg:p-16 border border-red-900/40 bg-gradient-to-b from-[#0a0a0a]/90 to-[#120a0a]/90 backdrop-blur-xl text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-amber-800/40 opacity-70" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-amber-800/40 opacity-70" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-amber-800/40 opacity-70" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-amber-800/40 opacity-70" />
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.05),transparent_60%)] pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-[0.2em] uppercase text-slate-200 mb-6">Join the Movement</h2>
                <p className="text-lg font-light tracking-wide text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
                  Whether you're a creator, viewer, or someone who believes in the power 
                  of authentic video content — there's a place for you at Vidiony.
                </p>
                <div className="flex gap-6 justify-center flex-wrap">
                  <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold border border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)] tracking-widest uppercase transition-all duration-300">
                    <Link href="/auth/register">Create Free Account</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="bg-transparent border-red-900/60 hover:border-red-500/50 hover:bg-red-950/20 text-slate-300 hover:text-amber-100 tracking-widest uppercase transition-all duration-300">
                    <Link href="/explore">Explore Content</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-16 relative border-t border-red-900/20 bg-[#050303]">
          <div className="container mx-auto px-4 flex flex-col items-center">
            <div className="mb-10 flex h-10 w-10 items-center justify-center border border-red-800 bg-red-950/20 text-red-600" style={{ borderRadius: '2px' }}>
              <span className="font-serif font-bold text-lg tracking-tighter">V</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10 text-xs tracking-[0.2em] uppercase text-slate-500 mb-10">
              <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
              <Link href="/help" className="hover:text-amber-500 transition-colors">Help Center</Link>
              <a href="mailto:hello@vidiony.com" className="hover:text-amber-500 transition-colors">Contact</a>
            </div>
            
            <p className="text-center text-xs tracking-widest text-slate-600 font-light uppercase">
              © 2026 Vidiony. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}