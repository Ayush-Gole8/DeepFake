/**
 * Home.tsx
 *
 * Landing page for DeepVerify with animated hero and concise system framing.
 */

import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, BrainCircuit, ScanSearch } from "lucide-react";
import gsap from "gsap";

const features = [
  {
    title: "Biological Signal Detection",
    description:
      "Extracts subtle pulse dynamics with rPPG across stable facial ROIs to surface synthetic temporal inconsistencies.",
    icon: Activity,
  },
  {
    title: "Geometric Analysis",
    description:
      "Tracks FaceMesh landmark motion, blink behavior, and structural coupling to catch physically implausible facial dynamics.",
    icon: BrainCircuit,
  },
  {
    title: "Explainable Results",
    description:
      "Returns modality-specific outputs and confidence signals so analysts can review why a verdict was produced.",
    icon: ScanSearch,
  },
];

function Home() {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [headingRef.current, subRef.current],
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="space-y-14 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_0_80px_-30px_rgba(6,182,212,0.45)] sm:p-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1
            ref={headingRef}
            className="font-serif text-4xl leading-tight text-slate-50 sm:text-5xl md:text-6xl"
          >
            Detect deepfakes in seconds
          </h1>
          <p ref={subRef} className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            DeepVerify combines dual-stream multimodal analysis: rPPG biological signal verification and FaceMesh
            geometric consistency analysis to improve robustness against modern synthetic media.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8"
          >
            <Link
              to="/analyse"
              className="inline-flex items-center rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
            >
              Start Analysis
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-6"
            >
              <div className="inline-flex rounded-lg bg-cyan-500/15 p-2 text-cyan-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-100">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}

export default Home;
