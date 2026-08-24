import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Features() {
  const features = [
    {
      icon: "⚡",
      title: "Instant Booking",
      text: "Book your ride quickly with a simple and smooth booking experience.",
      tag: "FAST",
    },
    {
      icon: "🛡️",
      title: "Safe & Secure",
      text: "Your safety matters. RYDO is designed to make every journey comfortable and secure.",
      tag: "SAFETY",
    },
    {
      icon: "📍",
      title: "Live Location",
      text: "Search your pickup and destination locations with accurate location-based features.",
      tag: "SMART",
    },
    {
      icon: "🚘",
      title: "Multiple Rides",
      text: "Choose from Mini, Sedan, SUV, Bike and Scooty according to your needs.",
      tag: "CHOICE",
    },
    {
      icon: "💳",
      title: "Easy Payments",
      text: "Pay conveniently using RYDO Wallet, UPI, Card or Cash.",
      tag: "PAYMENT",
    },
    {
      icon: "💬",
      title: "Chat With Driver",
      text: "Stay connected with your driver through chat and call options.",
      tag: "CONNECT",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#070A12] text-white overflow-hidden">

        {/* ================= HERO ================= */}

        <section className="relative pt-32 pb-20 px-6">

          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FFBE0B]/10 rounded-full blur-[150px] pointer-events-none" />

          <div className="relative max-w-6xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#FFBE0B]/30 bg-[#FFBE0B]/10">
              <span className="w-2 h-2 rounded-full bg-[#FFBE0B] animate-pulse" />

              <span className="text-[#FFBE0B] text-xs font-bold tracking-[0.25em] uppercase">
                RYDO Features
              </span>
            </div>

            <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none">
              Ride smarter.
              <br />

              <span className="text-[#FFBE0B]">
                Live better.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto mt-7 text-gray-400 text-lg md:text-xl leading-relaxed">
              Everything you need for a faster, safer and more
              comfortable journey — all in one place.
            </p>

            {/* BUTTONS */}

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">

              {/* CORRECT ROUTE */}
              <Link
                to="/bookride"
                className="bg-[#FFBE0B] text-black px-8 py-4 rounded-full font-black text-lg hover:scale-105 transition duration-300 shadow-[0_0_40px_rgba(255,190,11,0.15)]"
              >
                Book a Ride →
              </Link>

              <Link
                to="/"
                className="px-8 py-4 rounded-full border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition duration-300"
              >
                Back to Home
              </Link>

            </div>
          </div>

          {/* ================= STATS ================= */}

          <div className="relative max-w-6xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-[#FFBE0B]">
                01
              </p>

              <p className="text-gray-400 mt-2">
                Easy Booking
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-[#FFBE0B]">
                02
              </p>

              <p className="text-gray-400 mt-2">
                Ride Options
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-[#FFBE0B]">
                03
              </p>

              <p className="text-gray-400 mt-2">
                Payment Methods
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-3xl font-black text-[#FFBE0B]">
                04
              </p>

              <p className="text-gray-400 mt-2">
                Smart Experience
              </p>
            </div>

          </div>
        </section>

        {/* ================= FEATURES ================= */}

        <section className="py-24 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="text-center max-w-2xl mx-auto mb-16">

              <p className="text-[#FFBE0B] text-sm font-black tracking-[0.3em] uppercase">
                Powerful Features
              </p>

              <h2 className="text-4xl md:text-6xl font-black mt-4">
                Everything you need.
              </h2>

              <p className="text-gray-400 mt-5 text-lg">
                RYDO brings powerful technology and a simple
                experience together.
              </p>

            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {features.map((feature) => (

                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101521] p-7 hover:border-[#FFBE0B]/40 hover:-translate-y-2 transition-all duration-300"
                >

                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#FFBE0B]/10 blur-3xl opacity-0 group-hover:opacity-100 transition duration-500" />

                  <div className="relative">

                    <div className="flex items-center justify-between">

                      <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                        {feature.icon}
                      </div>

                      <span className="text-xs font-black tracking-widest text-[#FFBE0B]/60">
                        {feature.tag}
                      </span>

                    </div>

                    <h3 className="text-2xl font-black mt-8">
                      {feature.title}
                    </h3>

                    <p className="text-gray-400 mt-4 leading-relaxed">
                      {feature.text}
                    </p>

                    <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">

                      <span className="text-sm font-bold text-gray-500">
                        RYDO Experience
                      </span>

                      <span className="text-[#FFBE0B] text-xl group-hover:translate-x-2 transition duration-300">
                        →
                      </span>

                    </div>

                  </div>
                </div>
              ))}

            </div>

          </div>
        </section>

        {/* ================= PREMIUM EXPERIENCE ================= */}

        <section className="py-24 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#101521]">

              <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[#FFBE0B]/10 blur-[130px] rounded-full" />

              <div className="relative grid lg:grid-cols-2 gap-12 items-center p-8 md:p-14">

                <div>

                  <p className="text-[#FFBE0B] text-sm font-black tracking-[0.3em] uppercase">
                    The RYDO Difference
                  </p>

                  <h2 className="text-4xl md:text-6xl font-black mt-5 leading-tight">
                    Your journey.
                    <br />

                    <span className="text-[#FFBE0B]">
                      Your choice.
                    </span>
                  </h2>

                  <p className="text-gray-400 text-lg mt-6 leading-relaxed">
                    From quick city rides to comfortable journeys,
                    RYDO gives you the freedom to choose how you
                    want to travel.
                  </p>

                  {/* CORRECT ROUTE */}
                  <Link
                    to="/bookride"
                    className="inline-flex mt-8 bg-[#FFBE0B] text-black px-7 py-4 rounded-full font-black hover:scale-105 transition duration-300"
                  >
                    Start Your Journey →
                  </Link>

                </div>

                {/* RIDE PREVIEW */}

                <div className="relative">

                  <div className="rounded-[2rem] border border-white/10 bg-[#070A12] p-5 shadow-2xl">

                    <div className="rounded-[1.5rem] bg-[#151B29] p-6">

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="text-gray-500 text-xs tracking-widest">
                            RYDO
                          </p>

                          <h3 className="text-xl font-black mt-1">
                            Premium Ride
                          </h3>
                        </div>

                        <div className="w-12 h-12 rounded-full bg-[#FFBE0B] flex items-center justify-center text-xl">
                          🚕
                        </div>

                      </div>

                      <div className="mt-8">

                        <div className="flex gap-4">

                          <div className="flex flex-col items-center">

                            <div className="w-3 h-3 rounded-full bg-[#FFBE0B]" />

                            <div className="w-px h-12 bg-white/10" />

                            <div className="w-3 h-3 rounded-full border-2 border-[#FFBE0B]" />

                          </div>

                          <div className="space-y-6">

                            <div>
                              <p className="text-gray-500 text-xs">
                                PICKUP
                              </p>

                              <p className="font-bold mt-1">
                                Current Location
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 text-xs">
                                DESTINATION
                              </p>

                              <p className="font-bold mt-1">
                                Your Destination
                              </p>
                            </div>

                          </div>

                        </div>

                      </div>

                      <div className="mt-8 flex items-center justify-between bg-[#070A12] rounded-2xl p-4">

                        <div>

                          <p className="text-gray-500 text-xs">
                            ESTIMATED FARE
                          </p>

                          <p className="text-2xl font-black text-[#FFBE0B] mt-1">
                            ₹180
                          </p>

                        </div>

                        <span className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                          Available
                        </span>

                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================= WHY RYDO ================= */}

        <section className="py-24 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] text-sm font-black tracking-[0.3em] uppercase">
                Why RYDO
              </p>

              <h2 className="text-4xl md:text-6xl font-black mt-4">
                More than just
                <span className="text-[#FFBE0B]">
                  {" "}a ride.
                </span>
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-6">

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center hover:border-[#FFBE0B]/30 transition">

                <div className="text-5xl">
                  ⏱️
                </div>

                <h3 className="text-2xl font-black mt-5">
                  Save Time
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Find and book your ride without unnecessary
                  steps.
                </p>

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center hover:border-[#FFBE0B]/30 transition">

                <div className="text-5xl">
                  💰
                </div>

                <h3 className="text-2xl font-black mt-5">
                  Affordable
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Choose a ride that matches your journey and
                  budget.
                </p>

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center hover:border-[#FFBE0B]/30 transition">

                <div className="text-5xl">
                  ⭐
                </div>

                <h3 className="text-2xl font-black mt-5">
                  Premium
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Enjoy a modern, clean and comfortable RYDO
                  experience.
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* ================= FINAL CTA ================= */}

        <section className="relative py-28 px-6">

          <div className="absolute inset-0 bg-[#FFBE0B]/5 pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center">

            <div className="mx-auto w-20 h-20 rounded-3xl bg-[#FFBE0B] flex items-center justify-center text-4xl shadow-[0_0_60px_rgba(255,190,11,0.2)]">
              🚕
            </div>

            <h2 className="text-4xl md:text-6xl font-black mt-8">
              Ready to ride
              <span className="text-[#FFBE0B]">
                {" "}smarter?
              </span>
            </h2>

            <p className="text-gray-400 text-lg mt-5 max-w-xl mx-auto">
              Your next journey is only a few clicks away.
              Experience RYDO today.
            </p>

            {/* CORRECT ROUTE */}
            <Link
              to="/bookride"
              className="inline-flex mt-9 bg-[#FFBE0B] text-black px-9 py-5 rounded-full font-black text-lg hover:scale-105 transition duration-300 shadow-[0_0_50px_rgba(255,190,11,0.15)]"
            >
              Book Your Ride →
            </Link>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Features;
