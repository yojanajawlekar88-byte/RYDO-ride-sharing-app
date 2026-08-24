import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // SIGNUP
  // ============================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // CREATE FIREBASE AUTH ACCOUNT
      // --------------------------------------------------------

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      // --------------------------------------------------------
      // SAVE DISPLAY NAME IN FIREBASE AUTH
      // --------------------------------------------------------

      await updateProfile(user, {
        displayName: cleanName,
      });

      // --------------------------------------------------------
      // CREATE FIRESTORE USER DOCUMENT
      //
      // wallet = canonical wallet balance
      // walletBalance = backwards compatibility
      // --------------------------------------------------------

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await setDoc(
        userRef,
        {
          uid: user.uid,

          name: cleanName,

          displayName: cleanName,

          email: cleanEmail,

          phone: cleanPhone,

          wallet: 0,

          walletBalance: 0,

          role: "user",

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),

          transactions: [],
        },
        {
          merge: true,
        }
      );

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setSuccess(
        "Account created successfully! Redirecting..."
      );

      // Give Firebase state a moment to settle
      setTimeout(() => {
        navigate("/profile", {
          replace: true,
        });
      }, 700);

    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      switch (error.code) {
        case "auth/email-already-in-use":
          setError(
            "An account already exists with this email. Please login instead."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          setError(
            "Your password is too weak. Use at least 6 characters."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Email/password authentication is disabled in Firebase. Enable it in Firebase Authentication."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many requests. Please wait and try again."
          );
          break;

        default:
          setError(
            error.message ||
              "Unable to create your account. Please try again."
          );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6 py-20">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div className="hidden lg:block">

          <p className="text-[#FFBE0B] font-bold uppercase tracking-[0.3em]">
            Join RYDO
          </p>

          <h1 className="text-6xl font-black mt-5 leading-tight">
            Start Your
            <br />
            <span className="text-[#FFBE0B]">
              RYDO Journey.
            </span>
          </h1>

          <p className="text-gray-400 text-lg mt-6 max-w-lg leading-relaxed">
            Create your RYDO account and enjoy
            fast booking, live driver tracking,
            secure payments and easy ride management.
          </p>

          <div className="space-y-4 mt-10">

            <div className="flex items-center gap-4 bg-[#1E293B] rounded-2xl p-5 border border-white/5">

              <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl">
                🚖
              </div>

              <div>
                <h3 className="font-bold">
                  Fast Ride Booking
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Book a ride in just a few clicks.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-4 bg-[#1E293B] rounded-2xl p-5 border border-white/5">

              <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl">
                📍
              </div>

              <div>
                <h3 className="font-bold">
                  Live Tracking
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Follow your driver's journey.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-4 bg-[#1E293B] rounded-2xl p-5 border border-white/5">

              <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl">
                💳
              </div>

              <div>
                <h3 className="font-bold">
                  RYDO Wallet
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  Manage your ride payments securely.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
            SIGNUP CARD
        ====================================================== */}

        <div className="w-full max-w-md mx-auto">

          <div className="bg-[#1E293B] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10">

            {/* LOGO */}

            <div className="text-center">

              <Link
                to="/"
                className="text-4xl font-black text-[#FFBE0B] hover:opacity-90 transition"
              >
                RYDO
              </Link>

              <h2 className="text-3xl font-bold mt-8">
                Create Account 🚗
              </h2>

              <p className="text-gray-400 mt-2">
                Start your journey with RYDO.
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm leading-relaxed">
                <span className="mr-2">
                  ⚠️
                </span>
                {error}
              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================== */}

            {success && (
              <div className="mt-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-sm leading-relaxed">
                <span className="mr-2">
                  ✅
                </span>
                {success}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleSignup}
              className="mt-8 space-y-5"
            >

              {/* NAME */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                />

              </div>

              {/* PHONE */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Password
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                />

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                />

              </div>

              {/* SIGNUP BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading
                  ? "Creating Account..."
                  : "Create RYDO Account →"}
              </button>

            </form>

            {/* DIVIDER */}

            <div className="flex items-center gap-4 my-7">

              <div className="h-px bg-white/10 flex-1" />

              <span className="text-gray-500 text-sm">
                OR
              </span>

              <div className="h-px bg-white/10 flex-1" />

            </div>

            {/* LOGIN */}

            <p className="text-center text-gray-400">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-[#FFBE0B] font-bold hover:underline"
              >
                Login
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;
