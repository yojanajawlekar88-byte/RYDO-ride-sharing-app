import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  ArrowLeft,
  MapPin,
  Flag,
  CarFront,
  User,
  CreditCard,
  Clock,
  ShieldCheck,
  Route,
  CalendarDays,
  Timer,
  CheckCircle,
  Loader2,
} from "lucide-react";

function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [ride, setRide] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // AUTH
  // ==========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ==========================================================
  // LOAD RIDE
  // ==========================================================

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (!rideId) {
      setError("Ride ID is missing.");
      setLoading(false);
      return;
    }

    const loadRide = async () => {
      try {
        setLoading(true);
        setError("");

        const rideRef = doc(db, "rides", rideId);
        const rideSnapshot = await getDoc(rideRef);

        if (!rideSnapshot.exists()) {
          setError("Ride details not found.");
          setLoading(false);
          return;
        }

        const rideData = rideSnapshot.data();

        // Security check
        if (
          rideData.userId &&
          rideData.userId !== currentUser.uid
        ) {
          setError(
            "You are not authorized to view this ride."
          );
          setLoading(false);
          return;
        }

        setRide({
          firestoreId: rideSnapshot.id,
          ...rideData,
        });

        setLoading(false);
      } catch (firebaseError) {
        console.error(
          "Ride details error:",
          firebaseError
        );

        if (
          firebaseError.code === "permission-denied"
        ) {
          setError(
            "Firebase permission denied. Check your Firestore Rules."
          );
        } else {
          setError(
            firebaseError.message ||
              "Unable to load ride details."
          );
        }

        setLoading(false);
      }
    };

    loadRide();
  }, [currentUser, authLoading, rideId]);

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getDateFromRide = () => {
    if (!ride) return "Not available";

    // New booking format
    if (ride.rideDate) {
      return ride.rideDate;
    }

    // Fallback for older rides
    if (ride.createdAt) {
      try {
        const date =
          ride.createdAt?.toDate
            ? ride.createdAt.toDate()
            : new Date(ride.createdAt);

        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      } catch (error) {
        console.error(
          "Date conversion error:",
          error
        );
      }
    }

    return "Not available";
  };

  const getTimeFromRide = () => {
    if (!ride) return "Not available";

    // New booking format
    if (ride.rideTime) {
      return ride.rideTime;
    }

    // Fallback for older rides
    if (ride.createdAt) {
      try {
        const date =
          ride.createdAt?.toDate
            ? ride.createdAt.toDate()
            : new Date(ride.createdAt);

        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch (error) {
        console.error(
          "Time conversion error:",
          error
        );
      }
    }

    return "Not available";
  };

  const getETA = () => {
    if (!ride) return 0;

    return Number(
      ride.eta ??
        ride.arrival ??
        0
    );
  };

  const getStatus = () => {
    if (!ride) return "Unknown";

    return (
      ride.status ||
      ride.rideStatus ||
      "Searching for Driver"
    );
  };

  const getPaymentStatus = () => {
    if (!ride) return "Pending";

    return ride.paymentStatus || "Pending";
  };

  const getPaymentMethod = () => {
    if (!ride) return "Not available";

    return ride.paymentMethod || "Not available";
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (authLoading || loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6">
          <div className="text-center">
            <Loader2
              size={50}
              className="mx-auto text-[#FFBE0B] animate-spin"
            />

            <h2 className="mt-6 text-3xl font-black">
              Loading Ride Details...
            </h2>

            <p className="mt-3 text-gray-400">
              Fetching your RYDO ride information.
            </p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (!currentUser) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-3xl bg-[#1E293B] border border-white/10 p-10 text-center">

            <div className="text-6xl">
              🔐
            </div>

            <h1 className="mt-6 text-4xl font-black">
              Login Required
            </h1>

            <p className="mt-4 text-gray-400">
              Please login to view your ride details.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-8 rounded-full bg-[#FFBE0B] px-8 py-4 font-black text-black hover:scale-105 transition"
            >
              Login to RYDO →
            </button>

          </div>
        </main>

        <Footer />
      </>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error || !ride) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-3xl bg-[#1E293B] border border-red-500/20 p-10 text-center">

            <div className="text-6xl">
              ⚠️
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Ride Details Unavailable
            </h1>

            <p className="mt-4 text-red-400">
              {error || "Ride not found."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/ride-history")}
              className="mt-8 rounded-full bg-[#FFBE0B] px-8 py-4 font-black text-black hover:scale-105 transition"
            >
              ← Back to Ride History
            </button>

          </div>
        </main>

        <Footer />
      </>
    );
  }

  // ==========================================================
  // MAIN
  // ==========================================================

  const eta = getETA();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0B1020] text-white px-6 pt-32 pb-20">

        <div className="max-w-6xl mx-auto">

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => navigate("/ride-history")}
            className="flex items-center gap-2 text-gray-400 hover:text-[#FFBE0B] transition mb-8 font-bold"
          >
            <ArrowLeft size={20} />
            Back to Ride History
          </button>

          {/* HEADER */}

          <section className="mb-10">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="text-[#FFBE0B] text-sm font-black tracking-widest">
                  RYDO RIDE DETAILS
                </p>

                <h1 className="text-4xl md:text-5xl font-black mt-2">
                  {ride.rideId || ride.firestoreId}
                </h1>

                <p className="text-gray-400 mt-3">
                  Complete information about your ride
                </p>

              </div>

              <div
                className={`px-6 py-3 rounded-full font-black w-fit ${
                  String(getStatus())
                    .toLowerCase()
                    .includes("complete")
                    ? "bg-green-500/20 text-green-400"
                    : String(getStatus())
                        .toLowerCase()
                        .includes("cancel")
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {getStatus()}
              </div>

            </div>

          </section>

          {/* ROUTE */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9 mb-7">

            <div className="flex items-center gap-3 mb-7">

              <Route
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Route Information
              </h2>

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              {/* PICKUP */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <MapPin
                      size={22}
                      className="text-green-400"
                    />
                  </div>

                  <p className="text-gray-400 text-sm">
                    Pickup Location
                  </p>

                </div>

                <p className="font-black text-lg mt-4">
                  {ride.pickup || "Not available"}
                </p>

              </div>

              {/* DESTINATION */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Flag
                      size={22}
                      className="text-red-400"
                    />
                  </div>

                  <p className="text-gray-400 text-sm">
                    Destination
                  </p>

                </div>

                <p className="font-black text-lg mt-4">
                  {ride.destination ||
                    "Not available"}
                </p>

              </div>

            </div>

          </section>

          {/* ADDITIONAL INFORMATION */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9 mb-7">

            <div className="flex items-center gap-3 mb-7">

              <CalendarDays
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Additional Information
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-5">

              {/* DATE */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400">
                  Ride Date
                </p>

                <p className="font-black text-lg mt-2">
                  {getDateFromRide()}
                </p>

              </div>

              {/* TIME */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400">
                  Ride Time
                </p>

                <p className="font-black text-lg mt-2">
                  {getTimeFromRide()}
                </p>

              </div>

              {/* ETA */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400">
                  Driver ETA
                </p>

                <p className="font-black text-lg mt-2 text-green-400 flex items-center gap-2">
                  <Timer size={20} />

                  {eta > 0
                    ? `${eta} min`
                    : "Not available"}
                </p>

              </div>

            </div>

          </section>

          {/* RIDE INFORMATION */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9 mb-7">

            <div className="flex items-center gap-3 mb-7">

              <CarFront
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Ride Information
              </h2>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

              {/* RIDE TYPE */}

              <div className="rounded-2xl bg-[#0B1020] p-5">

                <p className="text-gray-400 text-sm">
                  Ride Type
                </p>

                <p className="font-black mt-2">
                  🚖{" "}
                  {ride.rideType ||
                    ride.ride ||
                    "Ride"}
                </p>

              </div>

              {/* FARE */}

              <div className="rounded-2xl bg-[#0B1020] p-5">

                <p className="text-gray-400 text-sm">
                  Fare
                </p>

                <p className="font-black text-[#FFBE0B] text-xl mt-2">
                  ₹
                  {Number(
                    ride.fare ?? 0
                  ).toFixed(0)}
                </p>

              </div>

              {/* DISTANCE */}

              <div className="rounded-2xl bg-[#0B1020] p-5">

                <p className="text-gray-400 text-sm">
                  Distance
                </p>

                <p className="font-black mt-2">
                  {ride.distance != null
                    ? `${ride.distance} km`
                    : "Not available"}
                </p>

              </div>

              {/* DURATION */}

              <div className="rounded-2xl bg-[#0B1020] p-5">

                <p className="text-gray-400 text-sm">
                  Duration
                </p>

                <p className="font-black mt-2">
                  {ride.duration ||
                    "Not available"}
                </p>

              </div>

            </div>

          </section>

          {/* DRIVER */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9 mb-7">

            <div className="flex items-center gap-3 mb-7">

              <User
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Driver Information
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-5">

              {/* DRIVER */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Driver
                </p>

                <p className="font-black text-xl mt-2">
                  👨‍✈️{" "}
                  {ride.driver ||
                    "Assigning..."}
                </p>

                {ride.driverRating && (
                  <p className="text-yellow-400 mt-2">
                    ⭐ {ride.driverRating} Rating
                  </p>
                )}

              </div>

              {/* VEHICLE */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Vehicle
                </p>

                <p className="font-black text-xl mt-2">
                  🚗{" "}
                  {ride.vehicle ||
                    "Not assigned"}
                </p>

              </div>

              {/* ETA */}

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Driver ETA
                </p>

                <p className="font-black text-xl text-green-400 mt-2">
                  ⏱{" "}
                  {eta > 0
                    ? `${eta} minutes`
                    : "Not available"}
                </p>

              </div>

            </div>

          </section>

          {/* PAYMENT */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9 mb-7">

            <div className="flex items-center gap-3 mb-7">

              <CreditCard
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Payment Information
              </h2>

            </div>

            <div className="grid md:grid-cols-3 gap-5">

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Payment Method
                </p>

                <p className="font-black mt-2">
                  {getPaymentMethod()}
                </p>

              </div>

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Payment Status
                </p>

                <p className="font-black mt-2 text-green-400 flex items-center gap-2">
                  <CheckCircle size={19} />

                  {getPaymentStatus()}
                </p>

              </div>

              <div className="rounded-2xl bg-[#0B1020] p-6">

                <p className="text-gray-400 text-sm">
                  Paid Amount
                </p>

                <p className="font-black text-xl text-[#FFBE0B] mt-2">
                  ₹
                  {Number(
                    ride.paidAmount ??
                      ride.fare ??
                      0
                  ).toFixed(0)}
                </p>

              </div>

            </div>

          </section>

          {/* OTP */}

          {ride.otp && (
            <section className="rounded-3xl border border-[#FFBE0B]/30 bg-[#FFBE0B]/10 p-7 md:p-9 mb-7">

              <div className="flex items-center gap-3">

                <ShieldCheck
                  size={27}
                  className="text-[#FFBE0B]"
                />

                <h2 className="text-2xl font-black">
                  Ride OTP
                </h2>

              </div>

              <p className="text-gray-400 mt-4">
                Use this OTP when starting your ride.
              </p>

              <p className="text-5xl font-black tracking-[0.4em] text-[#FFBE0B] mt-5">
                {ride.otp}
              </p>

            </section>
          )}

          {/* STATUS */}

          <section className="rounded-3xl bg-[#1E293B] border border-white/10 p-7 md:p-9">

            <div className="flex items-center gap-3">

              <Clock
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-2xl font-black">
                Ride Status
              </h2>

            </div>

            <div className="mt-6 rounded-2xl bg-[#0B1020] p-6">

              <p className="text-green-400 font-black text-xl">
                🚦 {getStatus()}
              </p>

              <p className="text-[#FFBE0B] font-bold mt-3">
                ⏱ Driver ETA:{" "}
                {eta > 0
                  ? `${eta} min`
                  : "Not available"}
              </p>

            </div>

          </section>

          {/* BACK */}

          <div className="mt-10 text-center">

            <button
              type="button"
              onClick={() =>
                navigate("/ride-history")
              }
              className="inline-flex items-center gap-2 rounded-full bg-[#FFBE0B] px-8 py-4 font-black text-black hover:scale-105 transition"
            >
              <ArrowLeft size={19} />
              Back to Ride History
            </button>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}

export default RideDetails;