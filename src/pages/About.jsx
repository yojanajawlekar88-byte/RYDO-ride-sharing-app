import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function About() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0B1020] text-white pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Left Side */}
          <div>
            <p className="text-[#FFBE0B] font-semibold uppercase tracking-widest">
              About Rydo
            </p>

            <h1 className="text-5xl font-black mt-4 leading-tight">
              Ride Smarter.
              <br />
              Travel Better.
            </h1>

            <p className="text-gray-400 mt-8 text-lg leading-8">
              Rydo is a premium ride-sharing platform built for fast,
              affordable and secure transportation. Whether you're
              travelling to college, office or airport, Rydo connects
              you with verified drivers in just a few taps.
            </p>

            <div className="grid grid-cols-2 gap-8 mt-12">

              <div>
                <h2 className="text-4xl font-bold text-[#FFBE0B]">
                  50K+
                </h2>
                <p className="text-gray-400 mt-2">
                  Happy Riders
                </p>
              </div>

              <div>
                <h2 className="text-4xl font-bold text-[#FFBE0B]">
                  10K+
                </h2>
                <p className="text-gray-400 mt-2">
                  Verified Drivers
                </p>
              </div>

              <div>
                <h2 className="text-4xl font-bold text-[#FFBE0B]">
                  100+
                </h2>
                <p className="text-gray-400 mt-2">
                  Cities Covered
                </p>
              </div>

              <div>
                <h2 className="text-4xl font-bold text-[#FFBE0B]">
                  24×7
                </h2>
                <p className="text-gray-400 mt-2">
                  Customer Support
                </p>
              </div>

            </div>

            <button className="mt-12 bg-[#FFBE0B] text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition">
              Learn More
            </button>

          </div>

          {/* Right Side */}

          <div className="bg-[#1E293B] rounded-3xl p-10 shadow-xl space-y-8">

            <div className="flex gap-5">
              <div className="text-5xl">🚖</div>

              <div>
                <h3 className="text-2xl font-bold">
                  Safe Rides
                </h3>

                <p className="text-gray-400 mt-2">
                  Verified drivers with live tracking.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="text-5xl">💳</div>

              <div>
                <h3 className="text-2xl font-bold">
                  Easy Payments
                </h3>

                <p className="text-gray-400 mt-2">
                  Pay securely using UPI, Cards or Wallets.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="text-5xl">📍</div>

              <div>
                <h3 className="text-2xl font-bold">
                  Live Tracking
                </h3>

                <p className="text-gray-400 mt-2">
                  Track your ride from pickup to destination.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="text-5xl">⭐</div>

              <div>
                <h3 className="text-2xl font-bold">
                  Top Rated Service
                </h3>

                <p className="text-gray-400 mt-2">
                  Thousands of satisfied riders trust Rydo every day.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}

export default About;