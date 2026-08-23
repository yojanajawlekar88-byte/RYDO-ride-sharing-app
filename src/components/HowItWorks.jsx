function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "📍",
      title: "Choose Your Destination",
      description:
        "Enter your pickup location and destination to start planning your journey.",
    },
    {
      number: "02",
      icon: "🚕",
      title: "Choose Your Ride",
      description:
        "Compare available rides, fares, drivers and arrival times.",
    },
    {
      number: "03",
      icon: "🛣️",
      title: "Enjoy Your Journey",
      description:
        "Track your driver in real time and enjoy a safe and comfortable ride.",
    },
  ];

  return (
    <section className="bg-[#0B1020] text-white py-24 px-6">

      <div className="max-w-7xl mx-auto">

        {/* Heading */}

        <div className="text-center max-w-3xl mx-auto">

          <p className="text-[#FFBE0B] font-bold uppercase tracking-widest">
            HOW IT WORKS
          </p>

          <h2 className="text-4xl md:text-5xl font-black mt-3">
            Ride with RYDO in
            <span className="text-[#FFBE0B]">
              {" "}3 simple steps
            </span>
          </h2>

          <p className="text-gray-400 text-lg mt-5">
            Getting where you need to go has never been easier.
          </p>

        </div>

        {/* Steps */}

        <div className="grid md:grid-cols-3 gap-8 mt-16">

          {steps.map((step, index) => (

            <div
              key={index}
              className="relative bg-[#111827] border border-gray-800 rounded-3xl p-8 hover:border-[#FFBE0B] hover:-translate-y-2 transition duration-300"
            >

              {/* Number */}

              <div className="absolute top-6 right-7 text-5xl font-black text-white/5">
                {step.number}
              </div>

              {/* Icon */}

              <div className="w-16 h-16 bg-[#FFBE0B] rounded-2xl flex items-center justify-center text-3xl">
                {step.icon}
              </div>

              {/* Content */}

              <h3 className="text-2xl font-bold mt-7">
                {step.title}
              </h3>

              <p className="text-gray-400 mt-4 leading-relaxed">
                {step.description}
              </p>

              {/* Connector */}

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 -right-7 text-[#FFBE0B] text-2xl z-10">
                  →
                </div>
              )}

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;