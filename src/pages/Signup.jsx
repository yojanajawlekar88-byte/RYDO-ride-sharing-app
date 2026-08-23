import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");

    // Validation
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (phone.length !== 10) {
  setError("Phone number must be exactly 10 digits.");
  return;
}

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // 1. Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 2. Create Firestore profile
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        phone: phone,

        totalRides: 0,
        rating: 5.0,
        wallet: 0,
        membership: "Silver",

        createdAt: new Date().toISOString(),
      });

      // 3. Success
      alert("Account created successfully! 🚗");

      // 4. Go to profile
      navigate("/profile");

    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        setError("An account already exists with this email.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(error.message);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6 py-20">

      <div className="w-full max-w-5xl">

        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT SIDE */}

          <div className="hidden lg:block">

            <Link
              to="/"
              className="text-5xl font-black text-[#FFBE0B]"
            >
              RYDO
            </Link>

            <h1 className="text-6xl font-black mt-8 leading-tight">
              Start Your
              <br />
              <span className="text-[#FFBE0B]">
                Journey.
              </span>
            </h1>

            <p className="text-gray-400 text-lg mt-6 max-w-md">
              Create your RYDO account and enjoy fast,
              safe and affordable rides whenever you need them.
            </p>

            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl">
                  🚖
                </div>

                <div>
                  <h3 className="font-bold">
                    Easy Ride Booking
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Book rides in just a few taps.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl">
                  📍
                </div>

                <div>
                  <h3 className="font-bold">
                    Live Tracking
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Track your driver in real time.
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl">
                  🛡️
                </div>

                <div>
                  <h3 className="font-bold">
                    Safe & Secure
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Your safety is our priority.
                  </p>
                </div>

              </div>

            </div>

          </div>


          {/* SIGNUP CARD */}

          <div className="bg-[#1E293B] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10">

            <div className="text-center">

              <Link
                to="/"
                className="text-4xl font-black text-[#FFBE0B] lg:hidden"
              >
                RYDO
              </Link>

              <h2 className="text-3xl font-bold mt-4">
                Create Account 🚗
              </h2>

              <p className="text-gray-400 mt-2">
                Join RYDO today.
              </p>

            </div>


            {/* ERROR */}

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                ⚠️ {error}
              </div>
            )}


            {/* FORM */}

            <form
              onSubmit={handleSignup}
              className="mt-8 space-y-5"
            >

              {/* FULL NAME */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition"
                />

              </div>


              {/* EMAIL */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition"
                />

              </div>


              {/* PHONE */}

<div>

  <label className="block text-sm font-semibold mb-2">
    Phone Number
  </label>

  <input
    type="tel"
    placeholder="Enter 10-digit phone number"
    value={phone}
    maxLength={10}
    inputMode="numeric"
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, "");

      if (value.length <= 10) {
        setPhone(value);
      }
    }}
    className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition"
  />

  {phone.length > 0 && phone.length < 10 && (
    <p className="text-red-400 text-sm mt-2">
      Phone number must be 10 digits.
    </p>
  )}

</div>

              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition"
                />

              </div>


              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition"
                />

              </div>


              {/* BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition disabled:opacity-50"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account →"}
              </button>

            </form>


            {/* LOGIN */}

            <p className="text-center text-gray-400 mt-7">

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