function RideShowcase() {
  const rides = [
    {
      name: "RYDO Mini",
      type: "Affordable & Comfortable",
      image:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80",
      price: "₹18/km",
      rating: "4.8",
      passengers: "4",
      luggage: "2",
    },
    {
      name: "RYDO Sedan",
      type: "Premium Everyday Ride",
      image:
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80",
      price: "₹26/km",
      rating: "4.9",
      passengers: "4",
      luggage: "3",
    },
    {
      name: "RYDO SUV",
      type: "Spacious Family Ride",
      image:
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80",
      price: "₹42/km",
      rating: "4.9",
      passengers: "6",
      luggage: "4",
    },
  ];

  return (
    <section className="bg-[#0B1020] text-white py-24 px-6">

      {/* Heading */}
      <div className="max-w-7xl mx-auto text-center">

        <p className="text-[#FFBE0B] font-semibold uppercase tracking-widest">
          Choose Your Ride
        </p>

        <h2 className="text-4xl md:text-6xl font-black mt-3">
          A Ride For Every Journey
        </h2>

        <p className="text-gray-400 max-w-2xl mx-auto mt-5 text-lg">
          From quick city trips to comfortable family journeys,
          choose the Rydo ride that fits your needs.
        </p>

      </div>

      {/* Ride Cards */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mt-14">

        {rides.map((ride, index) => (
          <div
            key={index}
            className="group bg-[#1E293B] rounded-3xl overflow-hidden
            border border-gray-800 hover:border-[#FFBE0B]
            shadow-xl hover:shadow-2xl
            transition-all duration-500 hover:-translate-y-3"
          >

            {/* Image */}
            <div className="relative h-64 overflow-hidden">

              <img
                src={ride.image}
                alt={ride.name}
                className="w-full h-full object-cover
                group-hover:scale-110 transition duration-700"
              />

              {/* Rating */}
              <div className="absolute top-4 right-4
                bg-black/70 backdrop-blur-md
                px-4 py-2 rounded-full
                text-white font-semibold"
              >
                ⭐ {ride.rating}
              </div>

            </div>

            {/* Content */}
            <div className="p-7">

              <h3 className="text-2xl font-bold">
                {ride.name}
              </h3>

              <p className="text-gray-400 mt-2">
                {ride.type}
              </p>

              {/* Features */}
              <div className="flex justify-between mt-6
                text-gray-300 text-sm">

                <span>👤 {ride.passengers} Seats</span>

                <span>🧳 {ride.luggage} Bags</span>

              </div>

              {/* Price */}
              <div className="flex items-center justify-between mt-7">

                <div>
                  <p className="text-gray-400 text-sm">
                    Starting from
                  </p>

                  <p className="text-2xl font-black text-[#FFBE0B]">
                    {ride.price}
                  </p>
                </div>

                <button
                  className="bg-[#FFBE0B] text-black
                  px-5 py-3 rounded-full
                  font-bold
                  hover:scale-105
                  transition"
                >
                  Book Now
                </button>

              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default RideShowcase;