import { useState } from "react";

function Features() {
  const [expandedFeature, setExpandedFeature] = useState(null);

  const features = [
    {
      icon: "⚡",
      title: "Fast Booking",
      description:
        "Book your ride within seconds with our simple and powerful booking system.",
      details:
        "Enter your pickup and destination, choose the ride that suits you, check the estimated fare and confirm your booking. RYDO is designed to make the entire booking process quick and simple.",
      points: [
        "Quick pickup and destination selection",
        "Multiple ride options",
        "Instant fare calculation",
        "Simple booking process",
      ],
    },
    {
      icon: "🛡️",
      title: "Safe Journey",
      description:
        "Ride confidently with verified drivers and reliable safety features.",
      details:
        "Your safety is an important part of the RYDO experience. Ride information, driver details and journey status can be viewed through the booking system so you can stay informed throughout your trip.",
      points: [
        "Driver information available after booking",
        "Ride status tracking",
        "Pickup and destination verification",
        "Journey information available in real time",
      ],
    },
    {
      icon: "💰",
      title: "Affordable Price",
      description:
        "Enjoy transparent fares with no hidden charges or surprises.",
      details:
        "RYDO calculates your estimated fare based on the selected ride type and journey distance. You can review the fare before confirming your ride, helping you understand the cost before you travel.",
      points: [
        "Distance-based fare calculation",
        "Multiple price-friendly ride types",
        "Fare shown before booking",
        "Wallet payment support",
      ],
    },
    {
      icon: "📍",
      title: "Live Tracking",
      description:
        "Track your driver in real time and know exactly when your ride will arrive.",
      details:
        "After your ride is booked, the map provides a live view of your journey. You can see the driver's movement, pickup location, destination and current ride status.",
      points: [
        "Live driver movement",
        "Pickup and destination markers",
        "Driver arrival status",
        "Estimated journey progress",
      ],
    },
    {
      icon: "🚗",
      title: "Multiple Rides",
      description:
        "Choose from Mini, Sedan, SUV and premium ride options.",
      details:
        "Choose the vehicle that matches your journey and budget. RYDO provides different ride categories so you can select an option that works best for your trip.",
      points: [
        "Mini for everyday travel",
        "Sedan for comfortable journeys",
        "SUV for larger groups or extra space",
        "Bike option for quick travel",
      ],
    },
    {
      icon: "📞",
      title: "24/7 Support",
      description:
        "Our support system is available whenever you need help with your ride.",
      details:
        "RYDO keeps important ride communication close to your booking experience. Depending on your current ride status, you can access driver communication options and manage your journey.",
      points: [
        "Driver communication",
        "Call option during active rides",
        "Chat support during the journey",
        "Ride cancellation controls",
      ],
    },
  ];

  const toggleFeature = (index) => {
    setExpandedFeature(
      expandedFeature === index ? null : index
    );
  };

  return (
    <section className="relative bg-black text-white py-24 px-6 overflow-hidden">

      {/* ================= BACKGROUND GLOW ================= */}

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
            <span className="text-[#FFBE0B]">
              {" "}in One Ride
            </span>
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

          {features.map((feature, index) => {

            const isExpanded = expandedFeature === index;

            return (
              <div
                key={index}
                className={`group bg-[#1E293B] border rounded-3xl p-8 transition-all duration-300 shadow-xl ${
                  isExpanded
                    ? "border-[#FFBE0B] -translate-y-2"
                    : "border-gray-800 hover:border-[#FFBE0B] hover:-translate-y-2"
                }`}
              >

                {/* ================= ICON ================= */}

                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 ${
                    isExpanded
                      ? "bg-[#FFBE0B] scale-110"
                      : "bg-[#FFBE0B]/10 group-hover:bg-[#FFBE0B] group-hover:scale-110"
                  }`}
                >
                  {feature.icon}
                </div>

                {/* ================= TITLE ================= */}

                <h3 className="mt-7 text-2xl font-bold text-white group-hover:text-[#FFBE0B] transition">
                  {feature.title}
                </h3>

                {/* ================= DESCRIPTION ================= */}

                <p className="mt-4 text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* ================= LEARN MORE BUTTON ================= */}

                <button
                  type="button"
                  onClick={() => toggleFeature(index)}
                  className="mt-6 inline-flex items-center gap-2 text-[#FFBE0B] font-bold hover:text-white transition-all duration-200"
                >
                  {isExpanded ? "Show less" : "Learn more"}

                  <span
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {/* ================= EXPANDED INFORMATION ================= */}

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-6"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">

                    <div className="border-t border-white/10 pt-5">

                      <p className="text-sm text-gray-300 leading-relaxed">
                        {feature.details}
                      </p>

                      <div className="mt-5 space-y-3">

                        {feature.points.map((point, pointIndex) => (
                          <div
                            key={pointIndex}
                            className="flex items-start gap-3"
                          >

                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/15 text-[#FFBE0B] text-xs font-black">
                              ✓
                            </span>

                            <p className="text-sm text-gray-400">
                              {point}
                            </p>

                          </div>
                        ))}

                      </div>

                    </div>

                  </div>
                </div>

              </div>
            );
          })}

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
