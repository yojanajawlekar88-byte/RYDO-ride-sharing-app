import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Dashboard() {
  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0B1020] text-white pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          <h1 className="text-5xl font-black text-center text-[#FFBE0B]">
            Dashboard
          </h1>

          <p className="text-center text-gray-400 mt-4">
            Welcome back, Rahul Sharma 👋
          </p>

          {/* Top Cards */}
          <div className="grid md:grid-cols-4 gap-6 mt-14">

            <div className="bg-[#1E293B] rounded-3xl p-8">
              <h2 className="text-[#FFBE0B] text-xl font-bold">
                Total Rides
              </h2>

              <p className="text-5xl font-black mt-5">
                128
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-3xl p-8">
              <h2 className="text-[#FFBE0B] text-xl font-bold">
                Wallet
              </h2>

              <p className="text-5xl font-black mt-5">
                ₹1250
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-3xl p-8">
              <h2 className="text-[#FFBE0B] text-xl font-bold">
                Rating
              </h2>

              <p className="text-5xl font-black mt-5">
                ⭐4.9
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-3xl p-8">
              <h2 className="text-[#FFBE0B] text-xl font-bold">
                Membership
              </h2>

              <p className="text-3xl font-bold text-green-400 mt-5">
                Gold
              </p>
            </div>

          </div>

          {/* Recent Activity */}
          <div className="bg-[#1E293B] rounded-3xl p-8 mt-12">

            <h2 className="text-3xl font-bold text-[#FFBE0B]">
              Recent Activity
            </h2>

            <div className="space-y-5 mt-8">

              <div className="flex justify-between border-b border-gray-700 pb-4">
                <span>Ride booked from Pune Station</span>
                <span className="text-green-400">Completed</span>
              </div>

              <div className="flex justify-between border-b border-gray-700 pb-4">
                <span>Wallet Recharge</span>
                <span className="text-[#FFBE0B]">₹500</span>
              </div>

              <div className="flex justify-between border-b border-gray-700 pb-4">
                <span>Ride to Airport</span>
                <span className="text-red-400">Cancelled</span>
              </div>

            </div>

          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">

           <div className="grid md:grid-cols-3 gap-8 mt-12">

  <Link to="/bookride">
    <button className="w-full bg-[#FFBE0B] text-black py-5 rounded-2xl font-bold text-xl hover:scale-105 transition">
      🚖 Book New Ride
    </button>
  </Link>

  <Link to="/profile">
    <button className="w-full bg-[#1E293B] py-5 rounded-2xl font-bold text-xl hover:bg-[#293548] transition">
      👤 Edit Profile
    </button>
  </Link>

  <Link to="/ridehistory">
    <button className="w-full bg-[#1E293B] py-5 rounded-2xl font-bold text-xl hover:bg-[#293548] transition">
      📜 Ride History
    </button>
  </Link>

</div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}

export default Dashboard;