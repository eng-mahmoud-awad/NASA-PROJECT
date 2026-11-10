"use client";

import React, { useState } from "react";
import RocketLaunchLoader from "@/components/RocketLaunchLoader";

export default function HomePage() {
  const [isLaunched, setIsLaunched] = useState<boolean>(false);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Rocket Preloader runs before revealing the dashboard */}
      {!isLaunched && (
        <RocketLaunchLoader
          duration={3800}
          onLaunchComplete={() => setIsLaunched(true)}
        />
      )}

      {/* Your Main Astronaut Health Dashboard */}
      <div
        className={`transition-opacity duration-700 ${
          isLaunched ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Paste or import your AstroVitals OS Dashboard component here */}
        <div className="p-8">
          <h1 className="text-2xl font-bold text-emerald-400">
            AstroVitals OS — Mission Control Active
          </h1>
        </div>
      </div>
    </main>
  );
}