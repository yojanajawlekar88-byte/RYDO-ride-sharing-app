import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  LogOut,
  Loader2,
  ShieldCheck,
  Car,
  Wallet,
  History,
  Home,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Settings,
  Crown,
  BadgeCheck,
  LockKeyhole,
  MapPin,
  Clock3,
  CreditCard,
  CircleUserRound,
} from "lucide-react";

import { auth, db } from "../firebase";

import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";


function Profile() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [oldName, setOldName] = useState("");

  const [oldPhone, setOldPhone] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");


  // =========================================================
  // AUTHENTICATION
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error("Authentication error:", authError);

        setUser(null);
        setLoading(false);
        setError("Unable to check your login status.");
      }
    );

    return () => unsubscribe();
  }, []);


  // =========================================================
  // LOAD FIRESTORE PROFILE
  // =========================================================

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const userRef = doc(db, "users", user.uid);

        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();

          const savedName =
            data.name ||
            data.displayName ||
            user.displayName ||
            "";

          const savedPhone =
            data.phone ||
            data.phoneNumber ||
            "";

          setName(savedName);
          setPhone(savedPhone);

          setOldName(savedName);
          setOldPhone(savedPhone);
        } else {
          const firebaseName =
            user.displayName || "";

          setName(firebaseName);
          setPhone("");

          setOldName(firebaseName);
          setOldPhone("");
        }
      } catch (profileError) {
        console.error(
          "Profile loading error:",
          profileError
        );

        if (
          profileError.code ===
          "permission-denied"
        ) {
          setError(
            "Firestore permission denied. Please check your Firebase Rules."
          );
        } else {
          setError(
            "Unable to load your profile."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);


  // =========================================================
  // START EDITING
  // =========================================================

  const startEditing = () => {
    setEditing(true);
    setMessage("");
    setError("");
  };


  // =========================================================
  // CANCEL EDITING
  // =========================================================

  const cancelEdit = () => {
    setName(oldName);
    setPhone(oldPhone);

    setEditing(false);

    setMessage("");
    setError("");
  };


  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = async () => {
    if (!user) {
      setError("Please login first.");
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (cleanName.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (
      cleanPhone &&
      !/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)
    ) {
      setError(
        "Please enter a valid phone number."
      );
      return;
    }

    try {
      setSaving(true);

      setError("");
      setMessage("");

      // Firebase Authentication
      await updateProfile(user, {
        displayName: cleanName,
      });

      // Firestore
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
          phone: cleanPhone,
          email: user.email || "",
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );

      setName(cleanName);
      setPhone(cleanPhone);

      setOldName(cleanName);
      setOldPhone(cleanPhone);

      setEditing(false);

      setMessage(
        "Your profile has been updated successfully."
      );
    } catch (saveError) {
      console.error(
        "Profile save error:",
        saveError
      );

      if (
        saveError.code ===
        "permission-denied"
      ) {
        setError(
          "Permission denied. Please check your Firestore Rules."
        );
      } else if (
        saveError.code ===
        "auth/requires-recent-login"
      ) {
        setError(
          "Please login again before changing your profile."
        );
      } else {
        setError(
          saveError.message ||
            "Unable to update your profile."
        );
      }
    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      setError("");

      await signOut(auth);

      navigate("/login");
    } catch (logoutError) {
      console.error(
        "Logout error:",
        logoutError
      );

      setError(
        "Unable to logout. Please try again."
      );
    }
  };


  // =========================================================
  // USER INFORMATION
  // =========================================================

  const displayName =
    name ||
    user?.displayName ||
    "RYDO User";

  const email =
    user?.email ||
    "No email available";

  const firstLetter =
    displayName.charAt(0).toUpperCase() ||
    "R";


  // =========================================================
  // PROFILE COMPLETION
  // =========================================================

  const profileCompletion = useMemo(() => {
    if (!user) return 0;

    let completed = 0;

    if (name.trim()) completed += 40;

    if (email) completed += 30;

    if (phone.trim()) completed += 30;

    return completed;
  }, [user, name, phone]);


  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050812] flex items-center justify-center px-6 text-white relative overflow-hidden">

        <div className="absolute w-[500px] h-[500px] bg-[#FFBE0B]/10 rounded-full blur-[140px] -top-40 -left-40" />

        <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] -bottom-40 -right-40" />

        <div className="relative z-10 text-center">

          <div className="w-24 h-24 mx-auto rounded-[30px] bg-gradient-to-br from-[#FFBE0B] to-[#FF8A00] flex items-center justify-center text-5xl font-black text-black shadow-[0_25px_80px_rgba(255,190,11,0.30)]">

            R

          </div>

          <Loader2
            size={32}
            className="mx-auto mt-7 animate-spin text-[#FFBE0B]"
          />

          <p className="mt-4 text-gray-400">
            Preparing your RYDO experience...
          </p>

        </div>
      </div>
    );
  }


  // =========================================================
  // LOGIN REQUIRED
  // =========================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050812] flex items-center justify-center px-6 text-white relative overflow-hidden">

        <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-[#FFBE0B]/10 blur-[130px] rounded-full" />

        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-purple-500/10 blur-[130px] rounded-full" />

        <div className="relative z-10 w-full max-w-md">

          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[35px] p-9 shadow-2xl text-center">

            <div className="w-24 h-24 mx-auto rounded-[30px] bg-gradient-to-br from-[#FFBE0B] to-[#FF8A00] flex items-center justify-center text-5xl font-black text-black shadow-[0_20px_70px_rgba(255,190,11,0.25)]">

              R

            </div>

            <p className="mt-7 text-xs font-black tracking-[0.35em] text-[#FFBE0B]">
              RYDO MEMBERSHIP
            </p>

            <h1 className="text-4xl font-black mt-4">
              Login Required
            </h1>

            <p className="text-gray-400 mt-4 leading-7">
              Sign in to unlock your personal
              RYDO dashboard and manage your
              rides.
            </p>

            <Link
              to="/login"
              className="mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFBE0B] to-[#FF9F00] text-black font-black py-4 rounded-2xl hover:scale-[1.02] transition shadow-lg"
            >
              Login to RYDO
              <ArrowRight size={18} />
            </Link>

          </div>

        </div>

      </div>
    );
  }


  // =========================================================
  // MAIN PROFILE PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-[#050812] text-white relative overflow-hidden">


      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute w-[600px] h-[600px] bg-[#FFBE0B]/[0.045] blur-[150px] rounded-full -top-60 -left-60" />

        <div className="absolute w-[600px] h-[600px] bg-purple-500/[0.045] blur-[150px] rounded-full top-[35%] -right-60" />

        <div className="absolute w-[500px] h-[500px] bg-blue-500/[0.035] blur-[150px] rounded-full bottom-[-200px] left-[25%]" />

      </div>


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#050812]/80 backdrop-blur-2xl">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* LOGO */}

          <Link
            to="/"
            className="group"
          >

            <div className="text-4xl font-black tracking-tight text-[#FFBE0B] group-hover:scale-105 transition">
              RYDO
            </div>

            <div className="text-[8px] tracking-[0.35em] text-gray-500 font-bold -mt-1">
              TAP • RIDE • ARRIVE
            </div>

          </Link>


          {/* DESKTOP NAV */}

          <div className="hidden lg:flex items-center gap-2 bg-white/[0.025] border border-white/[0.07] rounded-full p-1.5">

            <Link
              to="/"
              className="px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition font-semibold"
            >
              Home
            </Link>

            <Link
              to="/bookride"
              className="px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition font-semibold"
            >
              Book Ride
            </Link>

            <Link
              to="/wallet"
              className="px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition font-semibold"
            >
              Wallet
            </Link>

            <Link
              to="/ride-history"
              className="px-5 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition font-semibold"
            >
              Ride History
            </Link>

            <Link
              to="/profile"
              className="px-5 py-2.5 rounded-full bg-[#FFBE0B] text-black font-black shadow-[0_5px_25px_rgba(255,190,11,0.18)]"
            >
              Profile
            </Link>

          </div>


          {/* NAV ACTIONS */}

          <div className="flex items-center gap-3">

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/[0.08] border border-green-500/20">

              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <span className="text-xs font-bold text-green-400">
                Online
              </span>

            </div>


            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 border border-red-500/20 bg-red-500/[0.04] text-red-400 px-4 py-2.5 rounded-full hover:bg-red-500 hover:text-white transition"
            >

              <LogOut size={16} />

              <span className="hidden sm:block">
                Logout
              </span>

            </button>

          </div>

        </div>

      </nav>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-14">


        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <section className="mb-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFBE0B]/[0.07] border border-[#FFBE0B]/20 text-[#FFBE0B] text-xs font-black tracking-[0.15em]">

                <Sparkles size={15} />

                PREMIUM PROFILE

              </div>

              <h1 className="text-5xl md:text-7xl font-black mt-5 tracking-tight">
                Welcome back,
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE0B] via-[#FFD86A] to-white">
                  {displayName.split(" ")[0]}.
                </span>
              </h1>

              <p className="text-gray-500 mt-4 text-lg max-w-xl">
                Your personal RYDO space. Manage your
                details, security and ride experience
                from one place.
              </p>

            </div>


            {/* PROFILE COMPLETION */}

            <div className="w-full md:w-[300px] bg-white/[0.035] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-5">

              <div className="flex items-center justify-between mb-3">

                <span className="text-sm font-bold text-gray-400">
                  Profile completion
                </span>

                <span className="text-[#FFBE0B] font-black">
                  {profileCompletion}%
                </span>

              </div>

              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">

                <div
                  className="h-full bg-gradient-to-r from-[#FFBE0B] to-[#FF8A00] rounded-full transition-all duration-700"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />

              </div>

              <p className="text-xs text-gray-600 mt-3">
                {profileCompletion === 100
                  ? "Your profile is fully completed."
                  : "Add your phone number to complete your profile."}
              </p>

            </div>

          </div>

        </section>


        {/* ===================================================
            ALERTS
        =================================================== */}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/[0.07] border border-green-500/20 text-green-400 flex items-center gap-3">

            <CheckCircle2 size={20} />

            <span className="font-semibold">
              {message}
            </span>

          </div>
        )}


        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/20 text-red-400 flex items-center gap-3">

            <AlertCircle size={20} />

            <span className="font-semibold">
              {error}
            </span>

          </div>
        )}


        {/* ===================================================
            PREMIUM PROFILE HERO CARD
        =================================================== */}

        <section className="relative overflow-hidden bg-gradient-to-br from-white/[0.07] to-white/[0.025] border border-white/[0.10] backdrop-blur-2xl rounded-[38px] p-7 md:p-10 shadow-2xl">

          {/* CARD GLOW */}

          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-[#FFBE0B]/10 blur-[100px]" />

          <div className="absolute -bottom-40 -left-40 w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[100px]" />


          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">


            {/* AVATAR */}

            <div className="relative">

              <div className="absolute inset-[-8px] rounded-[40px] bg-gradient-to-br from-[#FFBE0B] to-transparent opacity-30 blur-md" />

              <div className="relative w-36 h-36 rounded-[38px] bg-gradient-to-br from-[#FFBE0B] via-[#FFB000] to-[#FF7A00] text-black flex items-center justify-center text-7xl font-black shadow-[0_25px_80px_rgba(255,190,11,0.25)]">

                {firstLetter}

              </div>


              {/* VERIFIED BADGE */}

              <div className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full bg-[#0B1220] border border-[#FFBE0B]/30 flex items-center justify-center shadow-xl">

                <BadgeCheck
                  size={23}
                  className="text-[#FFBE0B]"
                />

              </div>

            </div>


            {/* USER INFORMATION */}

            <div className="flex-1 text-center lg:text-left">

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 text-[#FFBE0B] text-xs font-black">

                  <Crown size={13} />

                  RYDO MEMBER

                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black">

                  <CheckCircle2 size={13} />

                  VERIFIED

                </span>

              </div>


              <h2 className="text-4xl md:text-5xl font-black mt-4">
                {displayName}
              </h2>


              <div className="mt-4 flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-6 text-gray-400">

                <span className="flex items-center justify-center gap-2">

                  <Mail size={16} />

                  {email}

                </span>

                <span className="flex items-center justify-center gap-2 text-green-400">

                  <ShieldCheck size={16} />

                  Account Active

                </span>

              </div>

            </div>


            {/* EDIT */}

            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                className="group bg-gradient-to-r from-[#FFBE0B] to-[#FF9900] text-black px-7 py-4 rounded-2xl font-black flex items-center gap-2 hover:-translate-y-1 transition shadow-[0_15px_40px_rgba(255,190,11,0.18)]"
              >

                <Edit3 size={18} />

                Edit Profile

                <ArrowRight
                  size={17}
                  className="group-hover:translate-x-1 transition"
                />

              </button>
            )}

          </div>

        </section>


        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}

        <section className="mt-7 bg-white/[0.035] border border-white/[0.08] backdrop-blur-xl rounded-[32px] p-7 md:p-9">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center">

                  <CircleUserRound
                    size={23}
                    className="text-[#FFBE0B]"
                  />

                </div>

                <div>

                  <h2 className="text-2xl font-black">
                    Personal Information
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Your account details and contact information.
                  </p>

                </div>

              </div>

            </div>


            {!editing && (
              <span className="text-xs text-gray-600 border border-white/[0.08] rounded-full px-4 py-2">
                Read-only mode
              </span>
            )}

          </div>


          <div className="grid md:grid-cols-2 gap-6">


            {/* FULL NAME */}

            <div>

              <label className="block text-gray-400 text-sm font-bold mb-2">
                Full Name
              </label>

              <div className="relative">

                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="text"
                  value={name}
                  disabled={!editing}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className={`w-full border rounded-2xl py-4 pl-12 pr-4 outline-none transition ${
                    editing
                      ? "bg-[#121A2A] border-[#FFBE0B]/30 text-white focus:border-[#FFBE0B] focus:ring-4 focus:ring-[#FFBE0B]/5"
                      : "bg-white/[0.025] border-white/[0.07] text-gray-400"
                  }`}
                />

              </div>

            </div>


            {/* EMAIL */}

            <div>

              <label className="block text-gray-400 text-sm font-bold mb-2">
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-white/[0.025] border border-white/[0.07] rounded-2xl py-4 pl-12 pr-4 text-gray-500 outline-none"
                />

              </div>

              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">

                <LockKeyhole size={11} />

                Managed securely by Firebase Authentication.

              </p>

            </div>


            {/* PHONE */}

            <div>

              <label className="block text-gray-400 text-sm font-bold mb-2">
                Phone Number
              </label>

              <div className="relative">

                <Phone
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="tel"
                  value={phone}
                  disabled={!editing}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+91 XXXXX XXXXX"
                  className={`w-full border rounded-2xl py-4 pl-12 pr-4 outline-none transition ${
                    editing
                      ? "bg-[#121A2A] border-[#FFBE0B]/30 text-white focus:border-[#FFBE0B] focus:ring-4 focus:ring-[#FFBE0B]/5"
                      : "bg-white/[0.025] border-white/[0.07] text-gray-400"
                  }`}
                />

              </div>

            </div>


            {/* ACCOUNT ID */}

            <div>

              <label className="block text-gray-400 text-sm font-bold mb-2">
                Account ID
              </label>

              <div className="relative">

                <ShieldCheck
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                />

                <input
                  type="text"
                  value={user.uid}
                  disabled
                  className="w-full bg-white/[0.025] border border-white/[0.07] rounded-2xl py-4 pl-12 pr-4 text-xs text-gray-600 outline-none"
                />

              </div>

            </div>

          </div>


          {/* SAVE BUTTONS */}

          {editing && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-7 border-t border-white/[0.07]">

              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-7 py-3 rounded-2xl border border-white/[0.10] text-gray-300 font-bold flex items-center justify-center gap-2 hover:bg-white/[0.05] transition disabled:opacity-50"
              >

                <X size={18} />

                Cancel

              </button>


              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#FFBE0B] to-[#FF9900] text-black font-black flex items-center justify-center gap-2 hover:-translate-y-0.5 transition shadow-lg disabled:opacity-50"
              >

                {saving ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />

                    Save Changes
                  </>
                )}

              </button>

            </div>
          )}

        </section>


        {/* ===================================================
            ACCOUNT STATUS CARDS
        =================================================== */}

        <section className="grid md:grid-cols-3 gap-5 mt-7">


          {/* SECURITY */}

          <div className="group relative overflow-hidden bg-white/[0.035] border border-white/[0.08] rounded-[28px] p-6 hover:-translate-y-1 transition">

            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-green-500/10 blur-2xl group-hover:bg-green-500/15 transition" />

            <div className="relative">

              <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/10 flex items-center justify-center">

                <ShieldCheck
                  size={25}
                  className="text-green-400"
                />

              </div>

              <h3 className="text-xl font-black mt-5">
                Secure Account
              </h3>

              <p className="text-gray-500 mt-2 leading-6 text-sm">
                Your account is protected with
                Firebase Authentication.
              </p>

              <div className="mt-5 flex items-center gap-2 text-green-400 text-xs font-bold">

                <CheckCircle2 size={15} />

                Security active

              </div>

            </div>

          </div>


          {/* RIDES */}

          <div className="group relative overflow-hidden bg-white/[0.035] border border-white/[0.08] rounded-[28px] p-6 hover:-translate-y-1 transition">

            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-[#FFBE0B]/10 blur-2xl group-hover:bg-[#FFBE0B]/15 transition" />

            <div className="relative">

              <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/10 flex items-center justify-center">

                <Car
                  size={25}
                  className="text-[#FFBE0B]"
                />

              </div>

              <h3 className="text-xl font-black mt-5">
                Ride Smarter
              </h3>

              <p className="text-gray-500 mt-2 leading-6 text-sm">
                Book, track and manage your RYDO
                journeys effortlessly.
              </p>

              <Link
                to="/bookride"
                className="mt-5 flex items-center gap-1 text-[#FFBE0B] text-xs font-bold group/link"
              >

                Book a ride

                <ArrowRight
                  size={14}
                  className="group-hover/link:translate-x-1 transition"
                />

              </Link>

            </div>

          </div>


          {/* PROFILE */}

          <div className="group relative overflow-hidden bg-white/[0.035] border border-white/[0.08] rounded-[28px] p-6 hover:-translate-y-1 transition">

            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/15 transition" />

            <div className="relative">

              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center">

                <User
                  size={25}
                  className="text-blue-400"
                />

              </div>

              <h3 className="text-xl font-black mt-5">
                Personal Profile
              </h3>

              <p className="text-gray-500 mt-2 leading-6 text-sm">
                Keep your personal information
                current and accurate.
              </p>

              <div className="mt-5 text-blue-400 text-xs font-bold">

                {profileCompletion}% complete

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section className="mt-7">

          <div className="flex items-center justify-between mb-5">

            <div>

              <p className="text-xs font-black tracking-[0.2em] text-[#FFBE0B]">
                EXPLORE RYDO
              </p>

              <h2 className="text-2xl font-black mt-2">
                Quick Actions
              </h2>

            </div>

          </div>


          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">


            {/* HOME */}

            <Link
              to="/"
              className="group bg-white/[0.035] border border-white/[0.08] rounded-[25px] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/[0.04] hover:-translate-y-1 transition"
            >

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center">

                  <Home
                    size={22}
                    className="text-[#FFBE0B]"
                  />

                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-[#FFBE0B] group-hover:translate-x-1 transition"
                />

              </div>

              <h3 className="font-black mt-5">
                Home
              </h3>

              <p className="text-gray-600 text-xs mt-1">
                RYDO dashboard
              </p>

            </Link>


            {/* BOOK RIDE */}

            <Link
              to="/bookride"
              className="group bg-white/[0.035] border border-white/[0.08] rounded-[25px] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/[0.04] hover:-translate-y-1 transition"
            >

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center">

                  <Car
                    size={22}
                    className="text-[#FFBE0B]"
                  />

                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-[#FFBE0B] group-hover:translate-x-1 transition"
                />

              </div>

              <h3 className="font-black mt-5">
                Book Ride
              </h3>

              <p className="text-gray-600 text-xs mt-1">
                Find your next ride
              </p>

            </Link>


            {/* WALLET */}

            <Link
              to="/wallet"
              className="group bg-white/[0.035] border border-white/[0.08] rounded-[25px] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/[0.04] hover:-translate-y-1 transition"
            >

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-2xl bg-green-500/10 flex items-center justify-center">

                  <Wallet
                    size={22}
                    className="text-green-400"
                  />

                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-green-400 group-hover:translate-x-1 transition"
                />

              </div>

              <h3 className="font-black mt-5">
                Wallet
              </h3>

              <p className="text-gray-600 text-xs mt-1">
                Manage your balance
              </p>

            </Link>


            {/* HISTORY */}

            <Link
              to="/ride-history"
              className="group bg-white/[0.035] border border-white/[0.08] rounded-[25px] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/[0.04] hover:-translate-y-1 transition"
            >

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center">

                  <History
                    size={22}
                    className="text-blue-400"
                  />

                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition"
                />

              </div>

              <h3 className="font-black mt-5">
                Ride History
              </h3>

              <p className="text-gray-600 text-xs mt-1">
                View your journeys
              </p>

            </Link>

          </div>

        </section>


        {/* ===================================================
            ACCOUNT INFORMATION
        =================================================== */}

        <section className="mt-7 grid md:grid-cols-2 gap-5">


          {/* ACCOUNT STATUS */}

          <div className="bg-gradient-to-br from-green-500/[0.08] to-transparent border border-green-500/10 rounded-[30px] p-7">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-black tracking-[0.2em] text-green-400">
                  ACCOUNT STATUS
                </p>

                <h3 className="text-2xl font-black mt-3">
                  Everything looks good.
                </h3>

              </div>

              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">

                <BadgeCheck
                  size={26}
                  className="text-green-400"
                />

              </div>

            </div>

            <div className="mt-6 space-y-3">

              <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">

                <span className="text-gray-500 flex items-center gap-2">

                  <ShieldCheck size={16} />

                  Authentication

                </span>

                <span className="text-green-400 text-sm font-bold">
                  Active
                </span>

              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">

                <span className="text-gray-500 flex items-center gap-2">

                  <Mail size={16} />

                  Email

                </span>

                <span className="text-green-400 text-sm font-bold">
                  Verified
                </span>

              </div>

              <div className="flex items-center justify-between py-3">

                <span className="text-gray-500 flex items-center gap-2">

                  <Clock3 size={16} />

                  Account

                </span>

                <span className="text-gray-400 text-sm font-bold">
                  RYDO Member
                </span>

              </div>

            </div>

          </div>


          {/* PREMIUM EXPERIENCE */}

          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFBE0B]/10 via-transparent to-purple-500/[0.06] border border-[#FFBE0B]/15 rounded-[30px] p-7">

            <div className="absolute -right-20 -top-20 w-52 h-52 bg-[#FFBE0B]/10 blur-[70px] rounded-full" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center">

                  <Crown
                    size={25}
                    className="text-[#FFBE0B]"
                  />

                </div>

                <div>

                  <p className="text-xs font-black tracking-[0.2em] text-[#FFBE0B]">
                    RYDO EXPERIENCE
                  </p>

                  <h3 className="text-xl font-black mt-1">
                    Ride Smarter.
                  </h3>

                </div>

              </div>

              <p className="text-gray-500 mt-5 leading-7">
                Your profile is the center of your
                RYDO experience. Keep your details
                updated for faster bookings and a
                smoother journey.
              </p>

              <Link
                to="/bookride"
                className="inline-flex items-center gap-2 mt-6 text-[#FFBE0B] font-black text-sm"
              >

                Start your next journey

                <ArrowRight size={16} />

              </Link>

            </div>

          </div>

        </section>


        {/* ===================================================
            LOGOUT
        =================================================== */}

        <section className="mt-7 bg-red-500/[0.035] border border-red-500/10 rounded-[30px] p-7">

          <div className="flex flex-col md:flex-row items-center justify-between gap-5">

            <div className="text-center md:text-left">

              <div className="flex items-center justify-center md:justify-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">

                  <LogOut
                    size={19}
                    className="text-red-400"
                  />

                </div>

                <h3 className="font-black text-lg">
                  Sign out of RYDO
                </h3>

              </div>

              <p className="text-gray-600 mt-2">
                End your current RYDO session securely.
              </p>

            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 border border-red-500/20 bg-red-500/[0.05] text-red-400 px-7 py-3 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition"
            >

              <LogOut size={18} />

              Logout

            </button>

          </div>

        </section>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="border-t border-white/[0.07] mt-12 pt-10 pb-6 text-center">

          <div className="flex items-center justify-center gap-2">

            <div className="w-8 h-8 rounded-xl bg-[#FFBE0B] flex items-center justify-center text-black font-black">
              R
            </div>

            <span className="text-xl font-black text-[#FFBE0B]">
              RYDO
            </span>

          </div>

          <p className="text-gray-600 text-sm mt-4">
            © 2026 RYDO — Ride Smarter.
          </p>

          <p className="text-gray-700 text-xs mt-2 tracking-[0.15em]">
            TAP. RIDE. ARRIVE.
          </p>

        </footer>

      </main>

    </div>
  );
}


export default Profile;