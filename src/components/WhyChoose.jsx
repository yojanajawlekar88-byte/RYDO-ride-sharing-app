function WhyChoose() {
  const features = [
    {
      icon: "⚡",
      title: "Quick Booking",
      text: "Find and book a ride in just a few taps.",
    },
    {
      icon: "🛡️",
      title: "Safe & Secure",
      text: "Your safety is our priority on every journey.",
    },
    {
      icon: "💰",
      title: "Affordable Fares",
      text: "Enjoy transparent and budget-friendly pricing.",
    },
    {
      icon: "📍",
      title: "Live Tracking",
      text: "Track your driver and ride location in real time.",
    },
  ];

  return (
    <section className="bg-[#0B1020] text-white py-24 px-6">

      <div className="max-w-7xl mx-auto">

        {/* Heading */}

        <div className="text-center max-w-3xl mx-auto">

          <p className="text-[#FFBE0B] font-bold uppercase tracking-widest">
            WHY RYDO
          </p>

          <h2 className="text-4xl md:text-5xl font-black mt-3">
            Everything you need for a
            <span className="text-[#FFBE0B]">
              {" "}better ride
            </span>
          </h2>

          <p className="text-gray-400 mt-5 text-lg">
            We've designed RYDO to make every journey
            simple, safe and comfortable.
          </p>

        </div>

        {/* Cards */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">

          {features.map((feature, index) => (

            <div
              key={index}
              className="bg-[#111827] border border-gray-800 rounded-3xl p-7 hover:border-[#FFBE0B] hover:-translate-y-2 transition duration-300"
            >

              <div className="text-5xl">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold mt-6">
                {feature.title}
              </h3>

              <p className="text-gray-400 mt-3 leading-relaxed">
                {feature.text}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default WhyChoose;