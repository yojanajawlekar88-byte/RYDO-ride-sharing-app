import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import WhyChoose from "../components/WhyChoose";
import HowItWorks from "../components/HowItWorks";
import PopularDestinations from "../components/PopularDestinations";
import Features from "../components/Features";
import RideShowcase from "../components/RideShowcase";
import Testimonials from "../components/Testimonials";
import DownloadApp from "../components/DownloadApp";
import Footer from "../components/Footer";

import LocationAutocomplete from "../components/LocationAutocomplete";

function QuickBookRide() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

  const canBook = pickup && destination;

  const handleBookRide = () => {
    if (!canBook) {
      navigate("/book-ride");
      return;
    }

    // Pass selected locations to BookRide.
    navigate("/book-ride", {
      state: {
        pickup,
        destination,
      },
    });
  };

  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:px-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFBE0B]/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#FFBE0B]">
            RIDE WITH RYDO
          </p>

          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Where are you going?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            Book a comfortable ride in seconds with live tracking,
            transparent pricing and reliable drivers.
          </p>
        </div>

        {/* Main booking card */}
        <div className="relative overflow-visible rounded-[2rem] border border-white/10 bg-[#11151F] p-5 shadow-2xl sm:p-7 lg:p-9">
          {/* Top accent */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FFBE0B] to-transparent" />

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            {/* Location fields */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <LocationAutocomplete
                  label="PICKUP LOCATION"
                  placeholder="Enter pickup location"
                  value={pickup}
                  onSelect={setPickup}
                />
              </div>

              <div>
                <LocationAutocomplete
                  label="DESTINATION"
                  placeholder="Where do you want to go?"
                  value={destination}
                  onSelect={setDestination}
                />
              </div>
            </div>

            {/* Button */}
            <div className="lg:pb-5">
              <button
                type="button"
                onClick={handleBookRide}
                className="group flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-[#FFBE0B] px-8 text-base font-black text-[#11151F] shadow-[0_10px_35px_rgba(255,190,11,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ffc928] hover:shadow-[0_15px_45px_rgba(255,190,11,0.3)] active:translate-y-0 lg:w-auto"
              >
                <span>
                  {canBook ? "BOOK YOUR RIDE" : "BOOK A RIDE"}
                </span>

                <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/10 text-lg">
                ⚡
              </span>

              <div>
                <p className="text-xs font-black text-white">
                  Fast Pickup
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Quick driver matching
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/10 text-lg">
                🛡️
              </span>

              <div>
                <p className="text-xs font-black text-white">
                  Safe Rides
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Trusted drivers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/10 text-lg">
                📍
              </span>

              <div>
                <p className="text-xs font-black text-white">
                  Live Tracking
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Track your driver
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFBE0B]/10 text-lg">
                💳
              </span>

              <div>
                <p className="text-xs font-black text-white">
                  Easy Payment
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Simple & secure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular ride types */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RideType
            icon="🏍️"
            title="Bike"
            description="Fast & affordable"
          />

          <RideType
            icon="🚗"
            title="Mini"
            description="Everyday comfort"
          />

          <RideType
            icon="🚘"
            title="Sedan"
            description="Extra comfort"
          />

          <RideType
            icon="🚙"
            title="SUV"
            description="More space"
          />
        </div>
      </div>
    </section>
  );
}

function RideType({ icon, title, description }) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#11151F]/80 px-5 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFBE0B]/30 hover:bg-white/[0.04]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFBE0B]/10 text-2xl transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>

      <div>
        <p className="font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080C18] text-white">
      <Navbar />

      <Hero />

      <WhyChoose />

      <HowItWorks />

      <PopularDestinations />

      {/* NEW RYDO QUICK BOOKING SECTION */}
      <QuickBookRide />

      <Features />

      <RideShowcase />

      <Testimonials />

      <DownloadApp />

      <Footer />
    </div>
  );
}

export default Home;
