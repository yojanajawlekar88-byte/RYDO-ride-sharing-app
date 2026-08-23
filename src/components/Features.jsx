function Features() {
  const features = [
    {
      icon: "⚡",
      title: "Fast Booking",
      description:
        "Book your ride within seconds with our simple and powerful booking system.",
    },
    {
      icon: "🛡️",
      title: "Safe Journey",
      description:
        "Ride confidently with verified drivers and reliable safety features.",
    },
    {
      icon: "💰",
      title: "Affordable Price",
      description:
        "Enjoy transparent fares with no hidden charges or surprises.",
    },
    {
      icon: "📍",
      title: "Live Tracking",
      description:
        "Track your driver in real time and know exactly when your ride will arrive.",
    },
    {
      icon: "🚗",
      title: "Multiple Rides",
      description:
        "Choose from Mini, Sedan, SUV and premium ride options.",
    },
    {
      icon: "📞",
      title: "24/7 Support",
      description:
        "Our support system is available whenever you need help with your ride.",
    },
  ];

  return (
    <section className="relative bg-black text-white py-24 px-6 overflow-hidden">

      {/* Background glow */}

      <div className="absolute top-20 left-0 w-72 h-72 bg-[#FFBE0B]/10 rounded-full blur-3xl" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFBE0B]/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="text-center max-w-3xl mx-auto">

          <p className="text-[#FFBE0B] font-bold tracking-[0.3em] text-sm uppercase">
            Why RYDO?
          </p>

          <h2 className="mt-4 text-5xl md:text-6xl font-black text-white">
            Everything You Need
            <span className="text-[#FFBE0B]"> in One Ride</span>
          </h2>

          <p className="mt-6 text-gray-400 text-lg leading-relaxed">
            RYDO makes every journey simple, safe and comfortable.
            From booking to arrival, everything is designed around you.
          </p>

        </div>

        {/* ================= STATS ================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-16">

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#FFBE0B]/50 transition">
            <p className="text-3xl md:text-4xl font-black text-[#FFBE0B]">
              10K+
            </p>
            <p className="mt-2 text-gray-400">
              Happy Riders
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#FFBE0B]/50 transition">
            <p className="text-3xl md:text-4xl font-black text-[#FFBE0B]">
              500+
            </p>
            <p className="mt-2 text-gray-400">
              Verified Drivers
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#FFBE0B]/50 transition">
            <p className="text-3xl md:text-4xl font-black text-[#FFBE0B]">
              50K+
            </p>
            <p className="mt-2 text-gray-400">
              Rides Completed
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#FFBE0B]/50 transition">
            <p className="text-3xl md:text-4xl font-black text-[#FFBE0B]">
              4.9 ⭐
            </p>
            <p className="mt-2 text-gray-400">
              Average Rating
            </p>
          </div>

        </div>

        {/* ================= FEATURES ================= */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">

          {features.map((feature, index) => (

            <div
              key={index}
              className="group bg-[#1E293B] border border-gray-800 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 transition-all duration-300 shadow-xl"
            >

              {/* Icon */}

              <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center text-4xl group-hover:bg-[#FFBE0B] group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>

              {/* Title */}

              <h3 className="mt-7 text-2xl font-bold text-white group-hover:text-[#FFBE0B] transition">
                {feature.title}
              </h3>

              {/* Description */}

              <p className="mt-4 text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Learn more */}

              <div className="mt-6 text-[#FFBE0B] font-semibold">
                Learn more →
              </div>

            </div>

          ))}

        </div>

        {/* ================= BOTTOM CTA ================= */}

        <div className="mt-16 rounded-3xl bg-[#FFBE0B] text-black p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">

          <div>

            <p className="text-black/60 font-bold uppercase tracking-widest text-sm">
              Your journey starts here
            </p>

            <h3 className="mt-2 text-3xl md:text-4xl font-black">
              Ready to ride with RYDO?
            </h3>

            <p className="mt-3 text-black/70">
              Book your next ride in just a few clicks.
            </p>

          </div>

          <a
            href="/bookride"
            className="bg-black text-[#FFBE0B] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition"
          >
            Book a Ride →
          </a>

        </div>

      </div>

    </section>
  );
}

export default Features;