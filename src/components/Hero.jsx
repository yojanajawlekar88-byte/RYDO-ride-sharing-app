import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#0B1020]">

      {/* Background Image */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=80')",
        }}
      ></div>

      {/* Dark Overlay */}

      <div className="absolute inset-0 bg-black/70"></div>

      {/* Content */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">

        <div className="max-w-3xl">

          {/* Small Badge */}

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full">

            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>

            <span className="text-gray-200">
              RYDO is available in your city
            </span>

          </div>

          {/* Main Heading */}

          <h1 className="text-6xl md:text-8xl font-black mt-8 leading-none">

            Your ride.
            <br />

            <span className="text-[#FFBE0B]">
              Your way.
            </span>

          </h1>

          {/* Tagline */}

          <p className="text-[#FFBE0B] text-xl md:text-2xl font-semibold mt-6">
            Tap.Ride.Arrive
          </p>

          <p className="text-gray-300 text-lg md:text-xl mt-5 max-w-2xl leading-relaxed">
            Fast, safe and affordable rides whenever you need them.
            Book your journey with RYDO and travel smarter.
          </p>

          {/* Buttons */}

          <div className="flex flex-wrap gap-4 mt-9">

            <Link
              to="/bookride"
              className="bg-[#FFBE0B] text-black px-8 py-4 rounded-full font-black text-lg hover:scale-105 transition shadow-xl"
            >
              🚕 Book a Ride
            </Link>

            <Link
              to="/learn-more"
              className="border border-white/40 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition"
            >
              Learn More
            </Link>

          </div>

          {/* Stats */}

          <div className="grid grid-cols-3 gap-6 max-w-xl mt-14">

            <div>
              <p className="text-3xl font-black text-[#FFBE0B]">
                10K+
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Happy Riders
              </p>
            </div>

            <div>
              <p className="text-3xl font-black text-[#FFBE0B]">
                5K+
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Drivers
              </p>
            </div>

            <div>
              <p className="text-3xl font-black text-[#FFBE0B]">
                4.9★
              </p>

              <p className="text-gray-400 text-sm mt-1">
                Rating
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Gradient */}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B1020] to-transparent"></div>

    </section>
  );
}

export default Hero;