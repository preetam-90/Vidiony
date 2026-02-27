"use client";

import { motion } from "framer-motion";
import {
    Play, Users, Search, MessageSquare,
    Zap, Shield, Globe, Code2,
    ArrowRight, Mail, ChevronRight, Video,
    Heart, History, Layers
} from "lucide-react";
import Link from "next/link";

const features = [
    {
        icon: <Users className="w-6 h-6 text-violet-400" />,
        title: "User Profiles",
        description: "Personalized user accounts with the ability to comment, like, and track watch history seamlessly."
    },
    {
        icon: <Play className="w-6 h-6 text-emerald-400" />,
        title: "Dynamic Video Content",
        description: "Support for various video formats, high-definition streaming, and an expansive library of user-uploaded content."
    },
    {
        icon: <Search className="w-6 h-6 text-sky-400" />,
        title: "Search & Discovery",
        description: "Real-time search with filtering options, trending videos, and intuitive navigation through diverse categories."
    },
    {
        icon: <MessageSquare className="w-6 h-6 text-rose-400" />,
        title: "Interactive Experience",
        description: "Engage with video comments, likes, and a unified watch history to pick up right where you left off."
    }
];

const team = [
    {
        name: "Alex Chen",
        role: "Founder & CEO",
        bio: "Former lead engineer at a major streaming service. Alex founded Vidion to democratize high-quality video delivery.",
        image: "https://i.pravatar.cc/150?u=alex"
    },
    {
        name: "Priya Patel",
        role: "Chief Technology Officer",
        bio: "Expert in distributed systems and video encoding. Priya ensures Vidion streams smoothly to millions of devices globally.",
        image: "https://i.pravatar.cc/150?u=priya"
    },
    {
        name: "Miguel Ramos",
        role: "Head of Design",
        bio: "Award-winning UX designer creating sleek, futuristic interfaces that make video discovery a delightful experience.",
        image: "https://i.pravatar.cc/150?u=miguel"
    }
];

const technologies = [
    "Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "tRPC", "Drizzle ORM", "HLS Streaming"
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

export default function AboutClient() {
    return (
        <main className="min-h-screen bg-[#020817] text-slate-100 overflow-hidden selection:bg-violet-500/30">
            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 py-24 relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header Section */}
                    <motion.div variants={itemVariants} className="text-center mb-24">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Welcome to the Future of Streaming
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            Discover. Share. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">Connect.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
                            Vidion is a cutting-edge video streaming platform designed for seamless video sharing and viewing. We prioritize user experience, performance, and community engagement.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div variants={itemVariants} className="mb-32">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
                            <p className="text-slate-400">Everything you need for an immersive video experience.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 mb-6 group-hover:border-violet-500/30 transition-colors">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                        <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Mission & Vision */}
                    <motion.div variants={itemVariants} className="mb-32">
                        <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-br from-violet-900/20 via-slate-900/50 to-sky-900/20 border border-slate-800 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                                <Globe className="w-64 h-64 text-slate-100" />
                            </div>
                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                    <Heart className="text-rose-400 w-8 h-8" />
                                    Our Mission
                                </h2>
                                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                    Vidion’s mission is to foster an open, creative, and interactive space for content creators and viewers alike. We believe that video has the power to educate, entertain, and inspire, and our platform is built to amplify those possibilities.
                                </p>
                                <p className="text-lg text-slate-300 leading-relaxed">
                                    We empower creators with professional-grade tools while providing viewers with a platform that encourages positive community engagement, privacy-respecting algorithms, and a delightfully smooth viewing experience.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Team Section */}
                    <motion.div variants={itemVariants} className="mb-32">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">The Team Behind Vidion</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                We are a group of passionate engineers, designers, and video enthusiasts dedicated to building the future of online streaming.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {team.map((member, idx) => (
                                <div key={idx} className="text-center group">
                                    <div className="relative w-32 h-32 mx-auto mb-6 transform transition-transform duration-500 group-hover:scale-105">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-500 to-sky-500 rounded-full blur-md opacity-30 group-hover:opacity-70 transition-opacity" />
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="relative z-10 w-full h-full object-cover rounded-full border-2 border-slate-800 group-hover:border-slate-600 transition-colors"
                                        />
                                    </div>
                                    <h3 className="text-xl font-semibold">{member.name}</h3>
                                    <p className="text-violet-400 text-sm mb-4 font-medium">{member.role}</p>
                                    <p className="text-slate-400 text-sm">{member.bio}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Technologies */}
                    <motion.div variants={itemVariants} className="mb-32 text-center">
                        <h2 className="text-3xl font-bold mb-10 flex items-center justify-center gap-3">
                            <Code2 className="text-sky-400 w-8 h-8" />
                            Powered by Modern Tech
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {technologies.map((tech, idx) => (
                                <span
                                    key={idx}
                                    className="px-6 py-3 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300 font-medium hover:border-violet-500/50 hover:bg-slate-800 transition-colors cursor-default"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                        <p className="mt-8 text-slate-400 max-w-2xl mx-auto">
                            Our tech stack is meticulously chosen to ensure lightning-fast load times, seamless playback across devices, and a fully responsive design targeting desktop and mobile.
                        </p>
                    </motion.div>

                    {/* CTA Section */}
                    <motion.div variants={itemVariants}>
                        <div className="relative p-12 md:p-16 rounded-3xl bg-slate-900/50 border border-slate-800 text-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-violet-900/10 pointer-events-none" />
                            <div className="relative z-10">
                                <h2 className="text-4xl font-bold mb-6">Ready to dive in?</h2>
                                <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                                    Explore millions of videos, create an account to start curating your own library, and join a vibrant, growing community.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href="/sign-up"
                                        className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20"
                                    >
                                        Create an Account <ArrowRight className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href="/videos"
                                        className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Explore Videos <Video className="w-5 h-5" />
                                    </Link>
                                </div>
                                <div className="mt-12 flex items-center justify-center gap-2 text-slate-400">
                                    <Mail className="w-5 h-5" />
                                    <span>Need assistance? <a href="mailto:support@vidion.app" className="text-violet-400 hover:text-violet-300 underline underline-offset-4">Contact Support</a></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </main>
    );
}
