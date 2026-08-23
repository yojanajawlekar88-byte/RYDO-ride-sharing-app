import { Link } from "react-router-dom";

function DashboardSidebar() {
  return (
    <div className="w-72 min-h-screen bg-black text-white p-8 flex flex-col">

      <h1 className="text-4xl font-black text-[#FFBE0B]">
        RYDO
      </h1>

      <p className="text-gray-400 mt-2">
        Ride Sharing
      </p>

      <div className="mt-12 flex flex-col gap-4">

        <Link
          to="/dashboard"
          className="bg-[#FFBE0B] text-black px-4 py-3 rounded-xl font-semibold"
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/bookride"
          className="text-white hover:bg-[#1E293B] hover:text-[#FFBE0B] px-4 py-3 rounded-xl transition-all duration-300"
        >
          🚖 Book Ride
        </Link>

        <Link
          to="/history"
          className="text-white hover:bg-[#1E293B] hover:text-[#FFBE0B] px-4 py-3 rounded-xl transition-all duration-300"
        >
          📍 Ride History
        </Link>

        <Link
          to="/saved"
          className="text-white hover:bg-[#1E293B] hover:text-[#FFBE0B] px-4 py-3 rounded-xl transition-all duration-300"
        >
          ❤️ Saved Places
        </Link>

        <Link
          to="/payments"
          className="text-white hover:bg-[#1E293B] hover:text-[#FFBE0B] px-4 py-3 rounded-xl transition-all duration-300"
        >
          💳 Payments
        </Link>

        <Link
          to="/settings"
          className="text-white hover:bg-[#1E293B] hover:text-[#FFBE0B] px-4 py-3 rounded-xl transition-all duration-300"
        >
          ⚙️ Settings
        </Link>

      </div>

      <Link
        to="/login"
        className="mt-auto bg-red-500 text-white rounded-xl py-3 text-center hover:bg-red-600 transition"
      >
        Logout
      </Link>

    </div>
  );
}

export default DashboardSidebar;