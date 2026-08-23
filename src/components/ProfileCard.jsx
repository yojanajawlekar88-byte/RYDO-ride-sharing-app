function ProfileCard() {
  return (
    <div className="bg-[#1E293B] rounded-3xl p-8 shadow-lg">

      <div className="flex items-center gap-5">

        <img
          src="https://i.pravatar.cc/150?img=12"
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-[#FFBE0B]"
        />

        <div>
          <h2 className="text-3xl font-bold text-white">
            Rahul Sharma
          </h2>

          <p className="text-[#FFBE0B] font-semibold">
            ⭐ Premium Member
          </p>

          <p className="text-gray-400">
            📍 Pune, Maharashtra
          </p>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">

        <div>
          <p className="text-gray-400">Email</p>
          <h3 className="text-white">rahul@gmail.com</h3>
        </div>

        <div>
          <p className="text-gray-400">Phone</p>
          <h3 className="text-white">+91 9876543210</h3>
        </div>

        <div>
          <p className="text-gray-400">Total Rides</p>
          <h3 className="text-white">126</h3>
        </div>

        <div>
          <p className="text-gray-400">Rating</p>
          <h3 className="text-yellow-400">★★★★★ 4.9</h3>
        </div>

      </div>

      <button className="mt-8 bg-[#FFBE0B] text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition">
        Edit Profile
      </button>

    </div>
  );
}

export default ProfileCard;