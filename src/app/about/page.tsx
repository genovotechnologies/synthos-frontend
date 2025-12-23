"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Home, Shield, Zap, Users, ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { SparklesCore } from "@/components/ui/sparkles";
import { SynthosLogoWithText } from "@/components/ui/synthos-logo";

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Features", url: "/#features", icon: Zap },
  { name: "Validation", url: "/#validation", icon: Shield },
  { name: "Testimonials", url: "/#testimonials", icon: Users },
];

export default function AboutPage() {
  return (
    <main className="bg-background text-foreground min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <NavBar items={navItems} />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-24">
        {/* Sparkles Background */}
        <div className="absolute inset-0">
          <SparklesCore
            id="about-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={40}
            className="w-full h-full"
            particleColor="#4A90D9"
            speed={0.5}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Home</span>
              </Link>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                <span className="text-white">About </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  SynthOS
                </span>
              </h1>
              
              <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8">
                The enterprise-grade synthetic data validation platform that prevents model collapse before it happens.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="p-8 md:p-12 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">Company</h2>
              </div>
              
              <div className="space-y-6 text-white/70 leading-relaxed">
                <p className="text-lg">
                  <strong className="text-white">SynthOS is a product of Genovo Technologies.</strong>
                </p>
                
                <p>
                  Genovo Technologies is dedicated to building next-generation tools for AI development, 
                  with a focus on ensuring data quality, model reliability, and training efficiency at scale.
                </p>
                
                <p>
                  Our flagship platform, SynthOS, provides enterprise-grade synthetic data validation 
                  that helps organizations prevent costly model collapse before training begins. 
                  With our proprietary multi-scale cascade architecture, we deliver 90%+ prediction 
                  accuracy with 48-hour turnaround times—backed by performance warranties.
                </p>

                <p>
                  SynthOS runs on scalable cloud infrastructure leveraging AWS compute, storage, 
                  and ML pipelines to perform large-scale validation efficiently.
                </p>
                
                <div className="pt-6 border-t border-white/10">
                  <a 
                    href="https://www.genovotech.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Visit Genovo Technologies
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Mission Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="mt-8 p-8 md:p-12 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-white">Our Mission</h2>
              </div>
              
              <div className="space-y-6 text-white/70 leading-relaxed">
                <p>
                  We believe that the future of AI depends on reliable, high-quality training data. 
                  As synthetic data becomes increasingly prevalent in model training, the risk of 
                  model collapse grows exponentially.
                </p>
                
                <p>
                  Our mission is to provide the industry&apos;s most accurate and efficient validation 
                  platform, giving AI teams the confidence to train at scale without fear of 
                  catastrophic failures.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  {[
                    { value: "49%", label: "Efficiency Gain" },
                    { value: "90%+", label: "Prediction Accuracy" },
                    { value: "48h", label: "Turnaround Time" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-lg bg-white/[0.03]">
                      <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
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
                <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
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
