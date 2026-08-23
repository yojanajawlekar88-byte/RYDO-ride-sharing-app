function About() {
  return (
    <section
      id="about"
      className="bg-[#0F172A] py-24 px-8"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Left Side */}
        <div>
          <p className="text-[#FFBE0B] font-semibold uppercase tracking-widest">
            About Rydo
          </p>

          <h2 className="text-5xl font-extrabold text-white mt-4 leading-tight">
            Ride Smarter.
            <br />
            Travel Better.
          </h2>

          <p className="text-gray-400 mt-8 text-lg leading-8">
            Rydo is a modern ride-sharing platform designed to make
            travelling simple, safe and affordable. Whether you're
            commuting to college, work or travelling across the city,
            Rydo connects you with verified drivers in just a few taps.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-10">

            <div>
              <h3 className="text-4xl font-bold text-[#FFBE0B]">
                50K+
              </h3>
              <p className="text-gray-400 mt-2">
                Happy Riders
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#FFBE0B]">
                10K+
              </h3>
              <p className="text-gray-400 mt-2">
                Verified Drivers
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#FFBE0B]">
                100+
              </h3>
              <p className="text-gray-400 mt-2">
                Cities Covered
              </p>
            </div>

            <div>
              <h3 className="text-4xl font-bold text-[#FFBE0B]">
                24/7
              </h3>
              <p className="text-gray-400 mt-2">
                Customer Support
              </p>
            </div>

          </div>

          <button className="mt-10 bg-[#FFBE0B] text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition">
            Learn More
          </button>

        </div>

        {/* Right Side */}

        <div className="bg-[#1E293B] rounded-3xl p-10 shadow-2xl">

          <div className="space-y-8">

            <div className="flex items-center gap-5">
              <div className="text-4xl">🚖</div>

              <div>
                <h3 className="text-white text-xl font-bold">
                  Safe Rides
                </h3>

                <p className="text-gray-400">
                  Verified drivers with live ride tracking.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-4xl">💳</div>

              <div>
                <h3 className="text-white text-xl font-bold">
                  Easy Payments
                </h3>

                <p className="text-gray-400">
                  Pay securely using UPI, Cards or Cash.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-4xl">📍</div>

              <div>
                <h3 className="text-white text-xl font-bold">
                  Live Tracking
                </h3>

                <p className="text-gray-400">
                  Track your ride in real-time from pickup to destination.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-4xl">⭐</div>

              <div>
                <h3 className="text-white text-xl font-bold">
                  Top Rated
                </h3>

                <p className="text-gray-400">
                  Thousands of satisfied riders trust Rydo every day.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default About;