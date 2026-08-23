import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function LearnMore() {
  const [showTopButton, setShowTopButton] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowTopButton(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleFAQ = (number) => {
    setOpenFAQ(openFAQ === number ? null : number);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0B1020] text-white">

        {/* =====================================================
            HERO
        ===================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-36 pb-20 px-6"
        >
          <div className="max-w-6xl mx-auto text-center">

            <p className="text-[#FFBE0B] font-bold tracking-[0.25em] uppercase text-sm">
              ABOUT RYDO
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5">
              Move Smarter.
              <br />

              <span className="text-[#FFBE0B]">
                Travel Better.
              </span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mt-6 leading-relaxed">
              RYDO is a modern ride and parcel delivery platform
              designed to make everyday transportation simple,
              safe and affordable.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-9">

              <Link
                to="/bookride"
                className="bg-[#FFBE0B] text-black px-8 py-4 rounded-full font-black hover:scale-105 transition"
              >
                🚕 Book a Ride
              </Link>

              <Link
                to="/features"
                className="border border-white/30 px-8 py-4 rounded-full font-bold hover:bg-white hover:text-black transition"
              >
                Explore Features
              </Link>

            </div>
          </div>
        </motion.section>


        {/* =====================================================
            HOW RYDO WORKS
        ===================================================== */}

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-20 px-6 bg-[#111827]"
        >
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                SIMPLE PROCESS
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                How RYDO Works
              </h2>

              <p className="text-gray-400 mt-4">
                Getting where you need to go takes only a few steps.
              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-6">

              {/* STEP 1 */}

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group bg-[#0B1020] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              >

                <div className="w-14 h-14 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center text-3xl group-hover:scale-125 transition-transform">
                  📍
                </div>

                <p className="text-[#FFBE0B] font-bold mt-6">
                  STEP 01
                </p>

                <h3 className="text-2xl font-black mt-2">
                  Choose Locations
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Enter your pickup and destination locations
                  to plan your journey.
                </p>

              </motion.div>


              {/* STEP 2 */}

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="group bg-[#0B1020] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              >

                <div className="w-14 h-14 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center text-3xl group-hover:scale-125 transition-transform">
                  🚕
                </div>

                <p className="text-[#FFBE0B] font-bold mt-6">
                  STEP 02
                </p>

                <h3 className="text-2xl font-black mt-2">
                  Choose Your Service
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Select Mini, Sedan, SUV, Bike or Scooty,
                  or choose parcel delivery.
                </p>

              </motion.div>


              {/* STEP 3 */}

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group bg-[#0B1020] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              >

                <div className="w-14 h-14 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center text-3xl group-hover:scale-125 transition-transform">
                  🏁
                </div>

                <p className="text-[#FFBE0B] font-bold mt-6">
                  STEP 03
                </p>

                <h3 className="text-2xl font-black mt-2">
                  Ride & Arrive
                </h3>

                <p className="text-gray-400 mt-3 leading-relaxed">
                  Confirm your booking, meet your driver and
                  reach your destination comfortably.
                </p>

              </motion.div>

            </div>
          </div>
        </motion.section>


        {/* =====================================================
            SERVICES
        ===================================================== */}

        <section className="py-20 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                RYDO SERVICES
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                More Than Just Rides
              </h2>

              <p className="text-gray-400 mt-4">
                Choose the service that best fits your needs.
              </p>

            </div>


            <div className="grid md:grid-cols-2 gap-6">

              {/* RIDES */}

              <div className="group bg-[#1E293B] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">

                <div className="text-5xl group-hover:scale-125 transition-transform">
                  🚕
                </div>

                <h3 className="text-3xl font-black mt-5">
                  Ride Services
                </h3>

                <p className="text-gray-400 mt-4 leading-relaxed">
                  Choose from different ride options based on
                  your budget, comfort and travel requirements.
                </p>

                <div className="flex flex-wrap gap-2 mt-6">

                  {["Mini", "Sedan", "SUV", "Bike", "Scooty"].map(
                    (item) => (
                      <span
                        key={item}
                        className="bg-[#0B1020] border border-white/10 px-4 py-2 rounded-full text-sm hover:border-[#FFBE0B] hover:text-[#FFBE0B] transition"
                      >
                        {item}
                      </span>
                    )
                  )}

                </div>
              </div>


              {/* PARCEL */}

              <div className="group bg-[#1E293B] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">

                <div className="text-5xl group-hover:scale-125 transition-transform">
                  📦
                </div>

                <h3 className="text-3xl font-black mt-5">
                  Parcel Delivery
                </h3>

                <p className="text-gray-400 mt-4 leading-relaxed">
                  Need to send something across the city?
                  RYDO lets you book secure parcel delivery
                  services quickly.
                </p>

                <div className="flex flex-wrap gap-2 mt-6">

                  {[
                    "Small Parcel",
                    "Bike Parcel",
                    "Large Parcel",
                  ].map((item) => (
                    <span
                      key={item}
                      className="bg-[#0B1020] border border-white/10 px-4 py-2 rounded-full text-sm hover:border-[#FFBE0B] hover:text-[#FFBE0B] transition"
                    >
                      {item}
                    </span>
                  ))}

                </div>
              </div>

            </div>
          </div>
        </section>


        {/* =====================================================
            WHY CHOOSE RYDO
        ===================================================== */}

        <section className="py-20 px-6 bg-[#111827]">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                WHY CHOOSE RYDO
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Built Around You
              </h2>

            </div>


            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {[
                {
                  icon: "⚡",
                  title: "Fast Booking",
                  text: "Find and book your service quickly.",
                },
                {
                  icon: "🛡️",
                  title: "Safe Journeys",
                  text: "Designed with rider safety in mind.",
                },
                {
                  icon: "💳",
                  title: "Easy Payments",
                  text: "Choose Wallet, Cash, UPI or Card.",
                },
                {
                  icon: "📍",
                  title: "Route Tracking",
                  text: "View your journey and locations easily.",
                },
              ].map((item) => (

                <div
                  key={item.title}
                  className="group bg-[#0B1020] rounded-3xl p-7 border border-white/10 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                >

                  <div className="text-4xl group-hover:scale-125 transition-transform">
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-black mt-5">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 mt-2 text-sm">
                    {item.text}
                  </p>

                </div>

              ))}

            </div>
          </div>
        </section>


        {/* =====================================================
            SAFETY
        ===================================================== */}

        <section className="py-24 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                YOUR SAFETY MATTERS
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Safety First with RYDO
              </h2>

              <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                RYDO is designed to provide a safer,
                comfortable and reliable experience.
              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-6">

              {[
                {
                  icon: "🛡️",
                  title: "Verified Drivers",
                  text: "Driver information can be verified before accepting a ride.",
                },
                {
                  icon: "📍",
                  title: "Ride Tracking",
                  text: "Keep track of your journey and ride location.",
                },
                {
                  icon: "📞",
                  title: "Help & Support",
                  text: "Riders can access support whenever they need help.",
                },
              ].map((item) => (

                <div
                  key={item.title}
                  className="group bg-[#1E293B] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >

                  <div className="text-5xl group-hover:scale-125 transition-transform">
                    {item.icon}
                  </div>

                  <h3 className="text-2xl font-black mt-6">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 mt-3 leading-relaxed">
                    {item.text}
                  </p>

                </div>

              ))}

            </div>
          </div>
        </section>


        {/* =====================================================
            RIDER EXPERIENCE
        ===================================================== */}

        <section className="py-20 px-6 bg-[#111827]">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                RIDER EXPERIENCE
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Why Riders Choose RYDO
              </h2>

              <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                Everything you need for a smooth, reliable
                and comfortable journey.
              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-6">

              {[
                {
                  icon: "🕐",
                  title: "Save Your Time",
                  text: "Book your ride quickly and spend less time waiting.",
                },
                {
                  icon: "💰",
                  title: "Affordable Rides",
                  text: "Choose a service that fits your budget.",
                },
                {
                  icon: "❤️",
                  title: "Travel Comfortably",
                  text: "Enjoy convenient journeys designed around your needs.",
                },
              ].map((item) => (

                <div
                  key={item.title}
                  className="group bg-[#0B1020] border border-white/10 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                >

                  <div className="text-5xl group-hover:scale-125 transition-transform">
                    {item.icon}
                  </div>

                  <h3 className="text-2xl font-black mt-6">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 mt-3 leading-relaxed">
                    {item.text}
                  </p>

                </div>

              ))}

            </div>
          </div>
        </section>


        {/* =====================================================
            RYDO AT A GLANCE
        ===================================================== */}

        <section className="py-20 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-12">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                RYDO AT A GLANCE
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Moving Thousands Every Day
              </h2>

            </div>


            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

              {[
                ["10K+", "Happy Riders"],
                ["5K+", "Drivers"],
                ["50K+", "Rides Completed"],
                ["4.9★", "Average Rating"],
              ].map(([number, label]) => (

                <div
                  key={label}
                  className="group text-center bg-[#1E293B] border border-white/10 rounded-3xl p-7 hover:border-[#FFBE0B] hover:-translate-y-2 transition-all duration-300"
                >

                  <p className="text-4xl md:text-5xl font-black text-[#FFBE0B] group-hover:scale-110 transition-transform">
                    {number}
                  </p>

                  <p className="text-gray-400 mt-2">
                    {label}
                  </p>

                </div>

              ))}

            </div>
          </div>
        </section>


        {/* =====================================================
            WHY RYDO
        ===================================================== */}

        <section className="py-24 px-6 bg-[#111827]">

          <div className="max-w-6xl mx-auto">

            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* LEFT */}

              <div>

                <p className="text-[#FFBE0B] font-bold tracking-widest">
                  WHY RYDO?
                </p>

                <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight">
                  More Than Just
                  <span className="text-[#FFBE0B]">
                    {" "}A Ride.
                  </span>
                </h2>

                <p className="text-gray-400 text-lg mt-6 leading-relaxed">
                  RYDO brings rides, parcel delivery, convenient
                  payments and a simple booking experience together
                  in one platform.
                </p>


                <div className="mt-8 space-y-5">

                  {[
                    [
                      "Simple & Easy",
                      "Book your service without complicated steps.",
                    ],
                    [
                      "Multiple Services",
                      "Choose rides or parcel delivery based on your needs.",
                    ],
                    [
                      "Designed for You",
                      "A modern experience built around everyday travel.",
                    ],
                  ].map(([title, text]) => (

                    <div
                      key={title}
                      className="flex items-start gap-4"
                    >

                      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl text-[#FFBE0B]">
                        ✓
                      </div>

                      <div>

                        <h3 className="font-bold text-lg">
                          {title}
                        </h3>

                        <p className="text-gray-400 text-sm mt-1">
                          {text}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

              </div>


              {/* RIGHT */}

              <div className="group bg-[#1E293B] border border-[#FFBE0B]/30 rounded-[2rem] p-10 hover:border-[#FFBE0B] hover:-translate-y-2 transition-all duration-300">

                <div className="text-6xl group-hover:scale-110 transition-transform">
                  🚕
                </div>

                <h3 className="text-3xl font-black mt-7">
                  Tap. Ride. Arrive.
                </h3>

                <p className="text-gray-400 mt-4 leading-relaxed">
                  Your journey starts with a simple tap.
                  Choose your destination, select your service
                  and let RYDO handle the rest.
                </p>


                <div className="grid grid-cols-2 gap-4 mt-8">

                  {[
                    ["⚡", "Fast"],
                    ["🛡️", "Safe"],
                    ["💰", "Affordable"],
                    ["❤️", "Reliable"],
                  ].map(([icon, title]) => (

                    <div
                      key={title}
                      className="bg-[#0B1020] rounded-2xl p-5"
                    >

                      <p className="text-[#FFBE0B] text-2xl">
                        {icon}
                      </p>

                      <p className="font-bold mt-2">
                        {title}
                      </p>

                    </div>

                  ))}

                </div>

              </div>

            </div>
          </div>
        </section>


        {/* =====================================================
            FAQ
        ===================================================== */}

        <section className="py-24 px-6">

          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-14">

              <p className="text-[#FFBE0B] font-bold tracking-widest">
                FAQ
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Frequently Asked Questions
              </h2>

              <p className="text-gray-400 mt-4">
                Everything you need to know about RYDO.
              </p>

            </div>


            <div className="space-y-4">

              {[
                {
                  id: 1,
                  question: "🚕 What is RYDO?",
                  answer:
                    "RYDO is a modern ride and parcel delivery platform that helps users book convenient transportation and delivery services.",
                },
                {
                  id: 2,
                  question: "📍 How do I book a ride?",
                  answer:
                    "Enter your pickup and destination locations, choose your preferred service and confirm your booking.",
                },
                {
                  id: 3,
                  question: "💳 What payment methods are available?",
                  answer:
                    "RYDO supports convenient payment options such as Wallet, Cash, UPI and Card.",
                },
                {
                  id: 4,
                  question: "📦 Can I send parcels with RYDO?",
                  answer:
                    "Yes. RYDO provides parcel delivery options for sending items across the city.",
                },
                {
                  id: 5,
                  question: "🛡️ Is RYDO focused on safety?",
                  answer:
                    "Yes. RYDO is designed with rider safety, reliable drivers and ride tracking in mind.",
                },
              ].map((faq) => (

                <div
                  key={faq.id}
                  className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FFBE0B] transition-all duration-300"
                >

                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-center justify-between text-left p-6"
                  >

                    <span className="text-lg md:text-xl font-bold">
                      {faq.question}
                    </span>

                    <span className="text-[#FFBE0B] text-2xl">
                      {openFAQ === faq.id ? "−" : "+"}
                    </span>

                  </button>


                  {openFAQ === faq.id && (

                    <div className="px-6 pb-6">

                      <p className="text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>

                    </div>

                  )}

                </div>

              ))}

            </div>
          </div>
        </section>


        {/* =====================================================
            GET STARTED
        ===================================================== */}

        <section className="py-20 px-6">

          <div className="max-w-6xl mx-auto">

            <div className="relative overflow-hidden bg-[#FFBE0B] rounded-[2rem] p-10 md:p-16 text-center">

              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full"></div>

              <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-black/5 rounded-full"></div>


              <div className="relative z-10">

                <div className="text-5xl">
                  🚀
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-black mt-6">
                  Ready to Get Started?
                </h2>

                <p className="text-black/70 text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
                  Whether you need a quick ride or want to send
                  a parcel, RYDO is ready to help you move smarter.
                </p>


                <div className="flex flex-wrap justify-center gap-4 mt-8">

                  <Link
                    to="/bookride"
                    className="bg-black text-white px-8 py-4 rounded-full font-black text-lg hover:scale-105 transition"
                  >
                    🚕 Book a Ride
                  </Link>

                  <Link
                    to="/signup"
                    className="bg-white text-black px-8 py-4 rounded-full font-black text-lg hover:scale-105 transition"
                  >
                    Create Account
                  </Link>

                </div>

              </div>

            </div>
          </div>
        </section>


        {/* =====================================================
            FINAL CTA
        ===================================================== */}

        <section className="py-24 px-6">

          <div className="group max-w-5xl mx-auto bg-[#1E293B] border border-[#FFBE0B]/30 rounded-[2rem] p-10 md:p-16 text-center hover:border-[#FFBE0B] hover:shadow-[0_0_50px_rgba(255,190,11,0.15)] transition-all duration-500">

            <div className="text-5xl group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-500">
              🚀
            </div>

            <h2 className="text-4xl md:text-5xl font-black mt-6">
              Ready to ride with RYDO?
            </h2>

            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">
              Your next journey is only a few clicks away.
              Choose your destination and let RYDO take care
              of the rest.
            </p>


            <div className="flex flex-wrap justify-center gap-4 mt-8">

              <Link
                to="/bookride"
                className="bg-[#FFBE0B] text-black px-9 py-4 rounded-full font-black text-lg hover:scale-110 transition-all duration-300"
              >
                🚕 Book Your Ride
              </Link>

              <Link
                to="/"
                className="border border-white/30 text-white px-9 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition"
              >
                🏠 Back to Home
              </Link>

            </div>

          </div>

        </section>

      </main>


      <Footer />


      {/* SCROLL TO TOP */}

      {showTopButton && (

        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#FFBE0B] text-black text-2xl font-black shadow-2xl hover:scale-110 hover:-translate-y-1 transition-all duration-300"
          aria-label="Scroll to top"
        >
          ↑
        </button>

      )}

    </>
  );
}

export default LearnMore;