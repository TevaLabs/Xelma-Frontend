import React from 'react';

// Tournament landing page – premium coming‑soon experience with roadmap
export default function Tournament() {
  return (
    <div className="min-h-screen bg-[#0A0F1A] text-[#F3F4F6] font-sans">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-[#1A1F2B] to-[#0A0F1A]">
        <h1 className="text-5xl font-bold text-[#BEC7FE] mb-4">Tournament</h1>
        <p className="text-lg text-gray-300 max-w-2xl text-center">
          Competitive play is on its way. Below you can see the roadmap for upcoming features and
          timelines. The "Join" button will be enabled once the backend is ready.
        </p>
      </section>

      {/* Roadmap Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 max-w-7xl mx-auto">
        {[
          { title: 'Beta Launch', desc: 'Early access for community testers', eta: 'Q3 2024' },
          { title: 'Season 1', desc: 'First full competitive season with leaderboards', eta: 'Q4 2024' },
          { title: 'Season 2+', desc: 'Expanded modes, prizes & sponsorships', eta: '2025' },
        ].map((card) => (
          <div key={card.title} className="bg-[#1A1F2B] rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow">
            <h2 className="text-2xl font-semibold text-[#BEC7FE] mb-2">{card.title}</h2>
            <p className="text-gray-400 mb-4">{card.desc}</p>
            <span className="text-sm text-gray-500">Target: {card.eta}</span>
          </div>
        ))}
      </section>

      {/* Call‑to‑Action (disabled) */}
      <section className="flex justify-center py-12">
        <button
          disabled
          className="btn-primary rounded-lg px-8 py-3 text-lg font-semibold opacity-50 cursor-not-allowed"
        >
          Join Tournament (Coming Soon)
        </button>
      </section>
    </div>
  );
}
