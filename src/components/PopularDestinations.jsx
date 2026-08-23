import { Link } from "react-router-dom";

function PopularDestinations() {
  const destinations = [
    {
      city: "Mumbai",
      place: "Gateway of India",
      image:
        "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=80",
    },

    {
      city: "Pune",
      place: "Shaniwar Wada",
      image:
        "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=900&q=80",
    },

    {
      city: "Goa",
      place: "Baga Beach",
      image:
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
    },

    {
      city: "Bengaluru",
      place: "Bangalore City",
      image:
        "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <section className="bg-[#0B1020] text-white py-24 px-6">

      <div className="max-w-7xl mx-auto">

        {/* Heading */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

          <div>

            <p className="text-[#FFBE0B] font-bold uppercase tracking-widest">
              EXPLORE WITH RYDO
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-3">
              Popular destinations
            </h2>

            <p className="text-gray-400 text-lg mt-4 max-w-2xl">
              Discover some of the most popular places you can
              reach with RYDO.
            </p>

          </div>

          <Link
            to="/bookride"
            className="text-[#FFBE0B] font-bold hover:underline"
          >
            Book a ride →
          </Link>

        </div>

        {/* Destination Cards */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">

          {destinations.map((destination, index) => (

            <div
              key={index}
              className="group relative h-[380px] rounded-3xl overflow-hidden cursor-pointer"
            >

              {/* Image */}

              <img
                src={destination.image}
                alt={destination.place}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
              />

              {/* Overlay */}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

              {/* Content */}

              <div className="absolute bottom-0 left-0 right-0 p-6">

                <p className="text-[#FFBE0B] font-semibold">
                  {destination.city}
                </p>

                <h3 className="text-2xl font-black mt-1">
                  {destination.place}
                </h3>

                <div className="mt-4 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-sm font-semibold">
                    Explore destination →
                  </span>
                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default PopularDestinations;