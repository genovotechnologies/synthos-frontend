"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Home, 
  Shield, 
  Zap, 
  Users, 
  ChevronRight, 
  CheckCircle, 
  ArrowRight,
  Lock,
  Clock,
  Cpu,
  TrendingUp,
  Target
} from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { SparklesCore } from "@/components/ui/sparkles";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import RadialOrbitalTimeline, { TimelineItem } from "@/components/ui/radial-orbital-timeline";
import { SynthosLogoWithText } from "@/components/ui/synthos-logo";

const navItems = [
  { name: "Home", url: "#hero", icon: Home },
  { name: "Features", url: "#features", icon: Zap },
  { name: "Validation", url: "#validation", icon: Shield },
  { name: "Testimonials", url: "#testimonials", icon: Users },
];

const testimonials = [
  {
    text: "Synthos validation saved us from a $50M training disaster. Their collapse detection is incredibly accurate.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Chen",
    role: "VP Engineering, AI Labs",
  },
  {
    text: "The 48-hour turnaround and 90%+ accuracy predictions have transformed our ML pipeline.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Sarah Mitchell",
    role: "Head of ML, TechCorp",
  },
  {
    text: "Finally, a platform that guarantees data quality with financial backing. Game changer.",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    name: "Michael Rodriguez",
    role: "CTO, DataStream AI",
  },
  {
    text: "Their multi-scale cascade validation is unlike anything else in the market.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    name: "Emily Watson",
    role: "ML Research Lead",
  },
  {
    text: "The warranty program gives us confidence to train models without fear of collapse.",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "James Kim",
    role: "Director of AI",
  },
  {
    text: "Synthos identified issues in our synthetic data that we never would have caught.",
    image: "https://randomuser.me/api/portraits/women/28.jpg",
    name: "Lisa Park",
    role: "Data Science Manager",
  },
  {
    text: "The ROI on using Synthos is incredible - prevented multiple costly training failures.",
    image: "https://randomuser.me/api/portraits/men/55.jpg",
    name: "Robert Thompson",
    role: "CEO, Neural Systems",
  },
  {
    text: "Their collapse signature library gets better with every validation. True network effect.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Amanda Foster",
    role: "Principal Engineer",
  },
  {
    text: "Best investment we made in our AI infrastructure. Essential for any serious ML team.",
    image: "https://randomuser.me/api/portraits/men/41.jpg",
    name: "Chris Anderson",
    role: "VP of Technology",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

// Orbital timeline data for core features
const featureTimelineData: TimelineItem[] = [
  {
    id: 1,
    title: "Collapse Prevention",
    date: "Core",
    content: "Detect model collapse signatures before training with our proprietary multi-scale cascade validation system.",
    category: "Detection",
    icon: Shield,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "90%+ Accuracy",
    date: "Prediction",
    content: "Predict billion-parameter model outcomes with confidence intervals backed by performance warranties.",
    category: "Analytics",
    icon: Target,
    relatedIds: [1, 4],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "48-Hour Turnaround",
    date: "Speed",
    content: "Get comprehensive validation reports with actionable recommendations in under 48 hours.",
    category: "Delivery",
    icon: Clock,
    relatedIds: [1, 5],
    status: "in-progress" as const,
    energy: 88,
  },
  {
    id: 4,
    title: "Performance Warranty",
    date: "Guarantee",
    content: "The only validation platform backed by financial guarantees on prediction accuracy.",
    category: "Trust",
    icon: Lock,
    relatedIds: [2, 6],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 5,
    title: "Multi-Scale Cascade",
    date: "Architecture",
    content: "Train 15-18 proxy models across 1M to 500M parameters for comprehensive scaling law extrapolation.",
    category: "Technology",
    icon: Cpu,
    relatedIds: [3, 6],
    status: "in-progress" as const,
    energy: 85,
  },
  {
    id: 6,
    title: "49% Efficiency Gain",
    date: "Optimization",
    content: "Our proprietary architecture delivers significant efficiency gains over traditional validation methods.",
    category: "Performance",
    icon: TrendingUp,
    relatedIds: [4, 5],
    status: "completed" as const,
    energy: 97,
  },
];

export default function SynthosLanding() {


  return (
    <main className="bg-background text-foreground min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <NavBar items={navItems} />

      {/* Hero Section with Shader Animation */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Shader Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <ShaderAnimation />
        </div>
        
        {/* Sparkles Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <SparklesCore
            id="hero-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={50}
            className="w-full h-full"
            particleColor="#4A90D9"
            speed={0.5}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge Pill */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
            >
              <Shield className="h-2 w-2 fill-cyan-500/80 text-cyan-500" />
              <span className="text-sm text-white/60 tracking-wide">
                Synthos Validation
              </span>
            </motion.div>

            {/* Headline - Clean gradient text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                  Build collapse-proof
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white/90 to-blue-300">
                  models, faster.
                </span>
              </h1>
            </motion.div>

            {/* Subtext - Clean, readable */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                A professional validation platform for AI teams.
                Predict training outcomes with 90%+ accuracy.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex items-center justify-center gap-4 relative z-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <Link
                href="/register"
                className="group relative px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full pointer-events-none" />
                <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-full opacity-50 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/login"
                className="group relative px-8 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-white/10 to-transparent p-[1px] pointer-events-none">
                  <div className="absolute inset-[1px] rounded-full bg-white/[0.05] backdrop-blur-xl" />
                </div>
                <span className="relative z-10 flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  Sign In
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Gooey Text Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-white/70 text-lg mb-4">The future of AI training is</p>
          </motion.div>
          <div className="h-[120px] flex items-center justify-center">
            <GooeyText
              texts={["Validated", "Certified", "Protected", "Synthos"]}
              morphTime={1.5}
              cooldownTime={0.5}
              className="font-bold"
              textClassName="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400"
            />
          </div>
        </div>
      </section>

      {/* Features Section - Orbital Timeline */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-4 bg-white/[0.03] backdrop-blur-md">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Core Features</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
              Enterprise-Grade Validation
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto mb-4">
              Our proprietary multi-scale cascade architecture delivers 49% efficiency gains 
              over traditional validation methods.
            </p>
            <p className="text-white/50 text-sm">
              Click on any node to explore • Connected features pulse when selected
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <RadialOrbitalTimeline timelineData={featureTimelineData} />
          </motion.div>
        </div>
      </section>

      {/* Validation Process Section */}
      <section id="validation" className="py-24 relative">
        <div className="absolute inset-0">
          <SparklesCore
            id="validation-sparkles"
            background="transparent"
            minSize={0.2}
            maxSize={0.8}
            particleDensity={30}
            className="w-full h-full"
            particleColor="#4A90D9"
            speed={0.3}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-4 bg-white/[0.03] backdrop-blur-md">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">How It Works</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
              48-Hour Validation Pipeline
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              From upload to certification, our end-to-end validation ensures your training data is collapse-proof.
            </p>
            <p className="text-white/50 text-xs mt-4 max-w-xl mx-auto">
              Synthos runs on scalable cloud infrastructure leveraging AWS compute, storage, and ML pipelines to perform large-scale validation efficiently.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Intelligent Analysis",
                time: "0-8 hours",
                points: ["Stratified diversity sampling", "Collapse signature matching", "Pre-screening risk assessment"],
              },
              {
                step: "02",
                title: "Multi-Scale Validation",
                time: "8-40 hours",
                points: ["15-18 proxy models trained", "1M to 500M parameter cascade", "Scaling law extrapolation"],
              },
              {
                step: "03",
                title: "Actionable Report",
                time: "40-48 hours",
                points: ["Pinpoint problematic rows", "Root cause analysis", "Fix recommendations"],
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className="relative p-8 rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
              >
                <div className="text-5xl font-bold text-cyan-400/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-sm text-cyan-400 mb-4 font-mono">{item.time}</p>
                <ul className="space-y-2">
                  {item.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "49%", label: "Efficiency Gain" },
              { value: "90%+", label: "Prediction Accuracy" },
              { value: "48h", label: "Turnaround Time" },
              { value: "$50M+", label: "Avg. Savings" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 font-mono">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 relative overflow-hidden bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-4 bg-white/[0.03] backdrop-blur-md">
              <Users className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-white">
              Trusted by AI Leaders
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              See what industry leaders say about Synthos validation platform.
            </p>
            <p className="text-white/50 text-xs mt-4 max-w-xl mx-auto italic">
              Testimonials shown are from private beta users and enterprise pilots. Company names anonymized.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[700px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 opacity-50">
          <SparklesCore
            id="cta-sparkles"
            background="transparent"
            minSize={0.3}
            maxSize={1}
            particleDensity={40}
            className="w-full h-full"
            particleColor="#4A90D9"
            speed={0.4}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
              <span className="text-white">Stop Burning Millions on</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                Broken Training Data
              </span>
            </h2>
            <p className="text-white/70 mb-10 text-lg leading-relaxed">
              Join the AI leaders who validate before they train. 
              Get your first validation report in 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              {/* Primary Button - Link to Register */}
              <Link 
                href="/register"
                className="group relative px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-lg pointer-events-none" />
                <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-lg opacity-50 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2 text-white">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Secondary Button - Link to Login */}
              <Link 
                href="/login"
                className="group relative px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/20 via-white/10 to-transparent p-[1px] pointer-events-none">
                  <div className="absolute inset-[1px] rounded-lg bg-white/[0.05] backdrop-blur-xl" />
                </div>
                <span className="relative z-10 flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                  Sign In
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <SynthosLogoWithText logoSize={36} showTagline />
              <p className="text-xs text-white/60">
                SynthOS is a product of{" "}
                <a 
                  href="https://www.genovotech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2"
                >
                  Genovo Technologies
                </a>
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="flex items-center gap-6 text-sm text-white/50">
                <a href="/about" className="hover:text-white/80 transition-colors">About</a>
                <a 
                  href="https://www.genovotech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white/80 transition-colors"
                >
                  Genovo Technologies
                </a>
              </div>
              <p className="text-sm text-white/50">
                © 2025 Genovo Technologies. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
