// src/components/Hero.tsx
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full py-10 bg-[url('/hero-background.jpg')] bg-cover bg-center overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center">
        {/* Left / Text side */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-accent">
            Real-time market data & news — powered by Finance API
          </h1>
          <p className="text-base md:text-xl text-zinc-300">
            Stay ahead with live stock charts, sentiment analysis, and company news — all in one dashboard.
          </p>
          <div className="flex justify-center lg:justify-start gap-4">
            <Link href="/auth/sign-in">
              <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-accent font-semibold rounded-lg shadow-lg">
                Get Started
              </button>
            </Link>
            <Link href="/about">
              <button className="px-6 py-3 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg">
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Right / Graphic side */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 flex justify-center">
          {/* Ideally an SVG or image showing chart, data etc. */}
          <Image
            src="/company-logo.png"
            alt="Live chart preview"
            width={500}
            height={500}
            className="w-54 sm:w-64 md:w-80 lg:w-full max-w-md object-contain"
          />
        </div>
      </div>

      
    </section>
  );
}
