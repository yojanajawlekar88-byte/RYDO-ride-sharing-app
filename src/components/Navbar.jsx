import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================
  // CHECK LOGIN STATUS
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setMenuOpen(false);

      alert("Logged out successfully! 👋");

      navigate("/login");
    } catch (error) {
      console.error(error);

      alert("Unable to logout. Please try again.");
    }
  };

  // ==========================================
  // CLOSE MOBILE MENU
  // ==========================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0B1020]/95 backdrop-blur-md border-b border-white/10">

      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* =====================================
            LOGO
        ===================================== */}

        <Link
          to="/"
          onClick={closeMenu}
          className="text-4xl font-black text-[#FFBE0B] tracking-wide hover:scale-105 transition"
        >
          RYDO
        </Link>

        {/* =====================================
            DESKTOP NAVIGATION
        ===================================== */}

        <ul className="hidden lg:flex items-center gap-7 text-white font-medium">

          {/* HOME */}

          <li>
            <Link
              to="/"
              className="hover:text-[#FFBE0B] transition"
            >
              Home
            </Link>
          </li>

          {/* BOOK RIDE */}

          <li>
            <Link
              to="/bookride"
              className="hover:text-[#FFBE0B] transition"
            >
              Book Ride
            </Link>
          </li>

          {/* PARCEL DELIVERY */}

          <li>
            <Link
              to="/parcel-delivery"
              className="hover:text-[#FFBE0B] transition"
            >
              📦 Parcel Delivery
            </Link>
          </li>

          {/* FEATURES */}

          <li>
            <Link
              to="/features"
              className="hover:text-[#FFBE0B] transition"
            >
              Features
            </Link>
          </li>

          {/* ABOUT */}

          <li>
            <Link
              to="/about"
              className="hover:text-[#FFBE0B] transition"
            >
              About
            </Link>
          </li>

          {/* CONTACT */}

          <li>
            <Link
              to="/contact"
              className="hover:text-[#FFBE0B] transition"
            >
              Contact
            </Link>
          </li>

          {/* ==================================
              LOGGED-IN LINKS
          ================================== */}

          {user && (
            <>
              {/* WALLET */}

              <li>
                <Link
                  to="/wallet"
                  className="hover:text-[#FFBE0B] transition"
                >
                  Wallet
                </Link>
              </li>

              {/* PROFILE */}

              <li>
                <Link
                  to="/profile"
                  className="hover:text-[#FFBE0B] transition"
                >
                  Profile
                </Link>
              </li>

              {/* RIDE HISTORY */}

              <li>
                <Link
                  to="/ridehistory"
                  className="hover:text-[#FFBE0B] transition"
                >
                  Ride History
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* =====================================
            DESKTOP BUTTONS
        ===================================== */}

        <div className="hidden lg:flex items-center gap-3">

          {!user ? (
            <>
              {/* LOGIN */}

              <Link
                to="/login"
                className="border border-[#FFBE0B] text-[#FFBE0B] px-5 py-2 rounded-full font-semibold hover:bg-[#FFBE0B] hover:text-black transition"
              >
                Login
              </Link>

              {/* SIGN UP */}

              <Link
                to="/signup"
                className="bg-[#FFBE0B] text-black px-5 py-2 rounded-full font-bold hover:scale-105 transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* LOGOUT */}

              <button
                onClick={handleLogout}
                className="border border-red-500 text-red-400 px-5 py-2 rounded-full font-bold hover:bg-red-500 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* =====================================
            MOBILE MENU BUTTON
        ===================================== */}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-white text-3xl"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* =======================================
          MOBILE MENU
      ======================================= */}

      {menuOpen && (
        <div className="lg:hidden bg-[#0B1020] border-t border-white/10 px-6 py-6">

          <div className="flex flex-col gap-5 text-white font-medium">

            {/* HOME */}

            <Link
              to="/"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              Home
            </Link>

            {/* BOOK RIDE */}

            <Link
              to="/bookride"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              🚗 Book Ride
            </Link>

            {/* PARCEL DELIVERY */}

            <Link
              to="/parcel-delivery"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              📦 Parcel Delivery
            </Link>

            {/* FEATURES */}

            <Link
              to="/features"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              Features
            </Link>

            {/* ABOUT */}

            <Link
              to="/about"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              About
            </Link>

            {/* CONTACT */}

            <Link
              to="/contact"
              onClick={closeMenu}
              className="hover:text-[#FFBE0B]"
            >
              Contact
            </Link>

            {/* ==================================
                LOGGED-IN MOBILE LINKS
            ================================== */}

            {user && (
              <>
                {/* WALLET */}

                <Link
                  to="/wallet"
                  onClick={closeMenu}
                  className="hover:text-[#FFBE0B]"
                >
                  Wallet
                </Link>

                {/* PROFILE */}

                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="hover:text-[#FFBE0B]"
                >
                  Profile
                </Link>

                {/* RIDE HISTORY */}

                <Link
                  to="/ridehistory"
                  onClick={closeMenu}
                  className="hover:text-[#FFBE0B]"
                >
                  Ride History
                </Link>
              </>
            )}

            {/* AUTH BUTTONS */}

            <div className="border-t border-white/10 pt-5">

              {!user ? (
                <div className="flex flex-col gap-3">

                  {/* LOGIN */}

                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="border border-[#FFBE0B] text-[#FFBE0B] text-center px-5 py-3 rounded-full font-semibold"
                  >
                    Login
                  </Link>

                  {/* SIGN UP */}

                  <Link
                    to="/signup"
                    onClick={closeMenu}
                    className="bg-[#FFBE0B] text-black text-center px-5 py-3 rounded-full font-bold"
                  >
                    Sign Up
                  </Link>

                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full border border-red-500 text-red-400 px-5 py-3 rounded-full font-bold hover:bg-red-500 hover:text-white transition"
                >
                  Logout
                </button>
              )}

            </div>

          </div>

        </div>
      )}
    </nav>
  );
}

export default Navbar;