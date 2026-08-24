import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      setSuccess("Login successful! Redirecting...");

      // Small delay so user can see success message
      setTimeout(() => {
        navigate("/profile", { replace: true });
      }, 500);

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      switch (err.code) {
        case "auth/invalid-credential":
          setError(
            "Incorrect email or password. Please check your credentials and try again."
          );
          break;

        case "auth/user-not-found":
          setError(
            "No RYDO account exists with this email address."
          );
          break;

        case "auth/wrong-password":
          setError(
            "Incorrect password. Please try again or reset your password."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/user-disabled":
          setError(
            "This account has been disabled. Please contact RYDO support."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many unsuccessful login attempts. Please wait a while and try again."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Email/password login is not enabled in Firebase Authentication."
          );
          break;

        default:
          setError(
            `Login failed: ${err.message || "Please try again."}`
          );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(
        "Enter your email address first, then click Forgot password."
      );
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(
        auth,
        cleanEmail
      );

      setSuccess(
        "Password reset email sent. Please check your inbox."
      );

    } catch (err) {
      console.error("PASSWORD RESET ERROR:", err);

      switch (err.code) {
        case "auth/user-not-found":
          setError(
            "No RYDO account exists with this email address."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many requests. Please wait and try again later."
          );
          break;

        default:
          setError(
            "Unable to send password reset email. Please try again."
          );
      }

    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6 py-20">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        {/* ==========================================
            LEFT SIDE
        ========================================== */}

        <div className="hidden lg:block">

          <p className="text-[#FFBE0B] font-bold uppercase tracking-[0.3em]">
            Welcome Back
          </p>

          <h1 className="text-6xl font-black mt-5 leading-tight">
            Ride Smarter.
            <br />
            Ride{" "}
            <span className="text-[#FFBE0B]">
              RYDO.
            </span>
          </h1>

          <p className="text-gray-400 text-lg mt-6 max-w-lg leading-relaxed">
            Your next journey is just one tap away.
            Login to book rides, track drivers, manage
            your wallet and view your ride history.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-10">

            <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/5">
              <div className="text-3xl">
                🚖
              </div>

              <h3 className="font-bold mt-3">
                Easy Booking
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                Book your ride in seconds.
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/5">
              <div className="text-3xl">
                📍
              </div>

              <h3 className="font-bold mt-3">
                Live Tracking
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                Track your driver live.
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/5">
              <div className="text-3xl">
                💳
              </div>

              <h3 className="font-bold mt-3">
                Smart Wallet
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                Manage your ride payments.
              </p>
            </div>

            <div className="bg-[#1E293B] rounded-2xl p-5 border border-white/5">
              <div className="text-3xl">
                🛡️
              </div>

              <h3 className="font-bold mt-3">
                Safe Rides
              </h3>

              <p className="text-gray-400 text-sm mt-1">
                Your safety comes first.
              </p>
            </div>

          </div>

        </div>

        {/* ==========================================
            LOGIN CARD
        ========================================== */}

        <div className="w-full max-w-md mx-auto">

          <div className="bg-[#1E293B] rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/10">

            {/* LOGO */}

            <div className="text-center">

              <Link
                to="/"
                className="text-4xl font-black text-[#FFBE0B]"
              >
                RYDO
              </Link>

              <h2 className="text-3xl font-bold mt-8">
                Welcome Back 👋
              </h2>

              <p className="text-gray-400 mt-2">
                Login to continue your journey.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 text-sm leading-relaxed">
                ✅ {success}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-semibold mb-2">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  autoComplete="email"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition text-white"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <div className="flex justify-between items-center mb-2">

                  <label className="text-sm font-semibold">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[#FFBE0B] text-sm hover:underline disabled:opacity-50"
                  >
                    {resetLoading
                      ? "Sending..."
                      : "Forgot password?"}
                  </button>

                </div>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  autoComplete="current-password"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition text-white"
                />

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Logging in..."
                  : "Login to RYDO →"}
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

            {/* SIGNUP */}

            <p className="text-center text-gray-400">

              Don't have an account?{" "}

              <Link
                to="/signup"
                className="text-[#FFBE0B] font-bold hover:underline"
              >
                Create Account
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
