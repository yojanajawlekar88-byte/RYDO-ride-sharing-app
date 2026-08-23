function DownloadApp() {
  return (
    <section className="bg-[#0B1020] py-24 px-6">

      <div className="max-w-6xl mx-auto">

        <div className="bg-gradient-to-r from-[#FFBE0B] to-[#ffcf4d] rounded-[2rem] p-10 md:p-16 overflow-hidden">

          <div className="grid md:grid-cols-2 gap-10 items-center">

            {/* LEFT SIDE */}

            <div className="text-black">

              <p className="font-bold text-lg mb-3">
                🚗 RYDO MOBILE APP
              </p>

              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                Your rides,
                <br />
                always with you.
              </h2>

              <p className="mt-5 text-lg text-black/70 max-w-lg">
                Book rides, track your driver, manage your wallet
                and view your ride history — all from the RYDO app.
              </p>

              {/* APP BUTTONS */}

              <div className="flex flex-wrap gap-4 mt-8">

                <button className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition">
                  ▶ Google Play
                </button>

                <button className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition">
                   App Store
                </button>

              </div>

            </div>


            {/* RIGHT SIDE */}

            <div className="flex justify-center">

              <div className="relative">

                {/* PHONE */}

                <div className="w-56 h-[420px] bg-black rounded-[2.5rem] border-8 border-gray-800 shadow-2xl p-4">

                  {/* PHONE SCREEN */}

                  <div className="h-full rounded-[2rem] bg-[#111827] overflow-hidden">

                    <div className="text-center pt-8">

                      <h3 className="text-3xl font-black text-[#FFBE0B]">
                        RYDO
                      </h3>

                      <p className="text-white text-sm mt-2">
                        Tap.Ride.Arrive
                      </p>

                    </div>

                    <div className="mx-4 mt-8 bg-[#1E293B] rounded-2xl p-4">

                      <p className="text-gray-400 text-xs">
                        Pickup
                      </p>

                      <p className="text-white font-semibold">
                        Your Location
                      </p>

                    </div>

                    <div className="mx-4 mt-3 bg-[#1E293B] rounded-2xl p-4">

                      <p className="text-gray-400 text-xs">
                        Destination
                      </p>

                      <p className="text-white font-semibold">
                        Your Destination
                      </p>

                    </div>

                    <button className="mx-4 mt-5 w-[calc(100%-2rem)] bg-[#FFBE0B] text-black py-3 rounded-xl font-bold">
                      Find Ride
                    </button>

                  </div>

                </div>

                {/* FLOATING ICONS */}

                <div className="absolute -left-12 top-20 bg-white rounded-2xl p-4 shadow-xl text-2xl">
                  🚖
                </div>

                <div className="absolute -right-12 bottom-24 bg-white rounded-2xl p-4 shadow-xl text-2xl">
                  📍
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default DownloadApp;