import { useState } from "react";

const rideDetails = {
  Mini: {
    fare: "₹180",
    arrival: "3 Minutes",
    driver: "Rahul Sharma",
    vehicle: "MH12 AB 1234",
  },

  Sedan: {
    fare: "₹260",
    arrival: "5 Minutes",
    driver: "Amit Patil",
    vehicle: "MH14 CD 5678",
  },

  SUV: {
    fare: "₹420",
    arrival: "8 Minutes",
    driver: "Priya Singh",
    vehicle: "MH16 EF 9012",
  },
};

function Booking() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [showRides, setShowRides] = useState(false);
  const [selectedRide, setSelectedRide] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  const ride = rideDetails[selectedRide];

  return (
    <section className="bg-slate-900 text-white py-20">
      <div className="max-w-6xl mx-auto bg-black rounded-3xl p-12">

        <h2 className="text-5xl font-bold text-center text-[#FFBE0B] mb-10">
          Book Your Ride
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <input
            type="text"
            placeholder="Pickup Location"
            value={pickup?.address}
            onChange={(e) => setPickup(e.target.value)}
            className="p-4 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

          <input
            type="text"
            placeholder="Drop Location"
            value={drop?.address}
            onChange={(e) => setDrop(e.target.value)}
            className="p-4 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

          <input
            type="date"
            className="p-4 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

          <input
            type="time"
            className="p-4 rounded-lg bg-gray-800 border border-gray-700 outline-none"
          />

        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => setShowRides(true)}
            className="bg-[#FFBE0B] text-black px-10 py-4 rounded-full font-bold hover:scale-105 transition"
          >
            Find Ride
          </button>
        </div>

        {showRides && (
          <div className="grid md:grid-cols-3 gap-6 mt-12">

            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <h3 className="text-2xl font-bold">🚗 Mini</h3>
              <p className="mt-2">₹180</p>
              <p>Arrival: 3 min</p>

              <button
                onClick={() => {
                  setSelectedRide("Mini");
                  setBookingDone(true);
                }}
                className="mt-4 bg-[#FFBE0B] text-black px-6 py-2 rounded-full font-bold"
              >
                Book Now
              </button>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <h3 className="text-2xl font-bold">🚙 Sedan</h3>
              <p className="mt-2">₹260</p>
              <p>Arrival: 5 min</p>

              <button
                onClick={() => {
                  setSelectedRide("Sedan");
                  setBookingDone(true);
                }}
                className="mt-4 bg-[#FFBE0B] text-black px-6 py-2 rounded-full font-bold"
              >
                Book Now
              </button>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <h3 className="text-2xl font-bold">🚘 SUV</h3>
              <p className="mt-2">₹420</p>
              <p>Arrival: 8 min</p>

              <button
                onClick={() => {
                  setSelectedRide("SUV");
                  setBookingDone(true);
                }}
                className="mt-4 bg-[#FFBE0B] text-black px-6 py-2 rounded-full font-bold"
              >
                Book Now
              </button>
            </div>

          </div>
        )}

        {bookingDone && ride && (
          <div className="bg-green-600 rounded-2xl mt-12 p-8">

            <h2 className="text-3xl font-bold text-center mb-6">
              ✅ Ride Booked Successfully!
            </h2>

            <div className="space-y-3 text-lg">

              <p>
                <span className="font-bold">Ride Type:</span> {selectedRide}
              </p>

              <p>
                <span className="font-bold">Pickup:</span> {pickup}
              </p>

              <p>
                <span className="font-bold">Drop:</span> {drop}
              </p>

              <p>
                <span className="font-bold">Fare:</span> {ride.fare}
              </p>

              <p>
                <span className="font-bold">Driver:</span> {ride.driver}
              </p>

              <p>
                <span className="font-bold">Vehicle:</span> {ride.vehicle}
              </p>

              <p>
                <span className="font-bold">Arrival:</span> {ride.arrival}
              </p>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}

export default Booking;