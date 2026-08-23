function Testimonials() {
  return (
   <section id="safety" className="...">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-5xl font-bold text-center text-[#FFBE0B] mb-12">
          What Our Customers Say
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-slate-800 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">⭐⭐⭐⭐⭐</h3>
            <p className="text-gray-300">
              "Rydo is super fast and affordable. I always book my office rides here."
            </p>
            <h4 className="mt-6 font-bold text-[#FFBE0B]">
              — Rahul
            </h4>
          </div>

          <div className="bg-slate-800 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">⭐⭐⭐⭐⭐</h3>
            <p className="text-gray-300">
              "Very safe rides and polite drivers. Highly recommended!"
            </p>
            <h4 className="mt-6 font-bold text-[#FFBE0B]">
              — Priya
            </h4>
          </div>

          <div className="bg-slate-800 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">⭐⭐⭐⭐⭐</h3>
            <p className="text-gray-300">
              "The booking process is smooth and the fares are reasonable."
            </p>
            <h4 className="mt-6 font-bold text-[#FFBE0B]">
              — Amit
            </h4>
          </div>

        </div>

      </div>
    </section>
  );
}

export default Testimonials;