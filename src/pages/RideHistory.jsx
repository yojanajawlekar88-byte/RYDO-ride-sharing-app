import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function RideHistory() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [rides, setRides] = useState([]);
  const [parcelDeliveries, setParcelDeliveries] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // SAFE HELPERS
  // =========================================================

  const getSafeText = (value, fallback = "Not available") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "object") {
      return (
        value.name ||
        value.address ||
        value.label ||
        value.title ||
        value.formatted ||
        value.display_name ||
        fallback
      );
    }

    return String(value);
  };

  const getLocationText = (location) => {
    if (!location) {
      return "Not available";
    }

    if (typeof location === "string") {
      return location;
    }

    if (typeof location === "object") {
      return (
        location.address ||
        location.name ||
        location.formatted ||
        location.display_name ||
        location.label ||
        location.location ||
        "Location not available"
      );
    }

    return String(location);
  };

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const getDateObject = (value) => {
    if (!value) {
      return null;
    }

    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (value instanceof Date) {
      return value;
    }

    if (
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      return new Date(value.seconds * 1000);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const getDateValue = (value) => {
    const date = getDateObject(value);

    return date ? date.getTime() : 0;
  };

  const formatDate = (value) => {
    const date = getDateObject(value);

    if (!date) {
      return "Date not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    const date = getDateObject(value);

    if (!date) {
      return "";
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // NUMBER HELPER
  // =========================================================

  const toNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const cleaned = value.replace(/[₹,\s]/g, "");
      const number = Number(cleaned);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return 0;
  };

  // =========================================================
  // FARE HELPER
  // =========================================================
  // Supports multiple possible Firebase field names.
  // This is especially important for parcel deliveries.

  const getFareValue = (item, isParcel = false) => {
    const possibleValues = isParcel
      ? [
          item.deliveryFare,
          item.deliveryFee,
          item.parcelFare,
          item.parcelFee,
          item.totalFare,
          item.totalAmount,
          item.amount,
          item.price,
          item.fare,
          item.paidAmount,

          // Nested payment objects
          item.payment?.amount,
          item.payment?.fare,
          item.payment?.total,
          item.paymentDetails?.amount,
          item.paymentDetails?.fare,
          item.paymentDetails?.total,
        ]
      : [
          item.fare,
          item.amount,
          item.price,
          item.paidAmount,
          item.totalFare,
          item.totalAmount,

          // Nested payment objects
          item.payment?.amount,
          item.payment?.fare,
          item.payment?.total,
          item.paymentDetails?.amount,
          item.paymentDetails?.fare,
          item.paymentDetails?.total,
        ];

    for (const value of possibleValues) {
      const number = toNumber(value);

      if (number > 0) {
        return number;
      }
    }

    return 0;
  };

  // =========================================================
  // DURATION PARSER
  // =========================================================

  const parseDurationMinutes = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (typeof value === "string") {
      const text = value
        .trim()
        .toLowerCase();

      // Examples:
      // 25 min
      // 25 mins
      // 1 hour 20 min
      // 1 hr 20 mins
      // 1h 20m
      const hourMatch = text.match(
        /(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h)\b/
      );

      const minuteMatch = text.match(
        /(\d+(?:\.\d+)?)\s*(?:minute|minutes|min|mins|m)\b/
      );

      const hours = hourMatch
        ? Number(hourMatch[1])
        : 0;

      const minutes = minuteMatch
        ? Number(minuteMatch[1])
        : 0;

      if (hours > 0 || minutes > 0) {
        return hours * 60 + minutes;
      }

      const numeric = Number(text);

      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }

    return 0;
  };

  // =========================================================
  // DISTANCE HELPER
  // =========================================================

  const getDistanceValue = (item) => {
    const possibleValues = [
      item.distanceKm,
      item.distance,
      item.distanceInKm,
      item.km,
      item.totalDistance,
      item.estimatedDistance,
      item.routeDistance,
      item.travelDistance,
    ];

    for (const value of possibleValues) {
      if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
      ) {
        return value;
      }

      if (typeof value === "string") {
        const numeric = parseFloat(value);

        if (
          Number.isFinite(numeric) &&
          numeric > 0
        ) {
          return numeric;
        }
      }
    }

    return 0;
  };

  // =========================================================
  // DURATION DISPLAY
  // =========================================================

  const getDurationText = (item, isParcel) => {
    // Direct duration values
    const storedDurationValues = [
      item.duration,
      item.estimatedDuration,
      item.travelDuration,
      item.tripDuration,
      item.deliveryDuration,
      item.estimatedDeliveryDuration,
      item.deliveryTime,
      item.estimatedTime,
      item.travelTime,

      // Nested values
      item.delivery?.duration,
      item.delivery?.estimatedDuration,
      item.ride?.duration,
    ];

    for (const value of storedDurationValues) {
      const minutes = parseDurationMinutes(value);

      if (minutes > 0) {
        return formatDuration(minutes);
      }
    }

    // Numeric duration fields
    const numericDurationValues = [
      item.durationMinutes,
      item.estimatedDurationMinutes,
      item.travelDurationMinutes,
      item.tripDurationMinutes,
      item.deliveryDurationMinutes,
      item.estimatedDeliveryMinutes,
      item.estimatedMinutes,
      item.travelTimeMinutes,
    ];

    for (const value of numericDurationValues) {
      const minutes = parseDurationMinutes(value);

      if (minutes > 0) {
        return formatDuration(minutes);
      }
    }

    // Fallback based on distance
    const distance = getDistanceValue(item);

    if (distance > 0) {
      const minutes = isParcel
        ? Math.max(5, Math.ceil(distance * 4))
        : Math.max(1, Math.ceil(distance * 3));

      return formatDuration(minutes);
    }

    return "Not available";
  };

  const formatDuration = (minutes) => {
    if (
      !Number.isFinite(minutes) ||
      minutes <= 0
    ) {
      return "Not available";
    }

    const rounded = Math.max(
      1,
      Math.ceil(minutes)
    );

    if (rounded < 60) {
      return `${rounded} min`;
    }

    const hours = Math.floor(
      rounded / 60
    );

    const remaining = rounded % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  };

  // =========================================================
  // AUTH
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setAuthLoading(false);

        if (!user) {
          setRides([]);
          setParcelDeliveries([]);
          setLoading(false);
        }
      },
      (authError) => {
        console.error(
          "AUTH ERROR:",
          authError
        );

        setError(
          authError.message ||
            "Unable to check login status."
        );

        setAuthLoading(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // FIREBASE HISTORY
  // =========================================================

  useEffect(() => {
    if (
      authLoading ||
      !currentUser
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const ridesQuery = query(
      collection(db, "rides"),
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

    const parcelsQuery = query(
      collection(
        db,
        "parcelDeliveries"
      ),
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

    let ridesLoaded = false;
    let parcelsLoaded = false;

    const finishLoading = () => {
      if (
        ridesLoaded &&
        parcelsLoaded
      ) {
        setLoading(false);
      }
    };

    // =======================================================
    // RIDES
    // =======================================================

    const unsubscribeRides =
      onSnapshot(
        ridesQuery,
        (snapshot) => {
          const rideList =
            snapshot.docs.map(
              (rideDoc) => ({
                firestoreId:
                  rideDoc.id,
                recordType:
                  "ride",
                ...rideDoc.data(),
              })
            );

          rideList.sort(
            (a, b) =>
              getDateValue(
                b.createdAt
              ) -
              getDateValue(
                a.createdAt
              )
          );

          setRides(rideList);

          ridesLoaded = true;
          finishLoading();
        },
        (firebaseError) => {
          console.error(
            "RIDES FIRESTORE ERROR:",
            firebaseError
          );

          setError(
            firebaseError.message ||
              "Unable to load ride history."
          );

          ridesLoaded = true;
          finishLoading();
        }
      );

    // =======================================================
    // PARCELS
    // =======================================================

    const unsubscribeParcels =
      onSnapshot(
        parcelsQuery,
        (snapshot) => {
          const parcelList =
            snapshot.docs.map(
              (parcelDoc) => ({
                firestoreId:
                  parcelDoc.id,
                recordType:
                  "parcel",
                ...parcelDoc.data(),
              })
            );

          parcelList.sort(
            (a, b) =>
              getDateValue(
                b.createdAt
              ) -
              getDateValue(
                a.createdAt
              )
          );

          setParcelDeliveries(
            parcelList
          );

          parcelsLoaded = true;
          finishLoading();
        },
        (firebaseError) => {
          console.error(
            "PARCEL FIRESTORE ERROR:",
            firebaseError
          );

          setParcelDeliveries([]);

          if (
            firebaseError.code ===
            "permission-denied"
          ) {
            setError(
              "Parcel delivery history permission denied. Please check your Firestore Rules."
            );
          } else {
            setError(
              firebaseError.message ||
                "Unable to load parcel delivery history."
            );
          }

          parcelsLoaded = true;
          finishLoading();
        }
      );

    return () => {
      unsubscribeRides();
      unsubscribeParcels();
    };
  }, [
    currentUser,
    authLoading,
  ]);

  // =========================================================
  // COMBINED HISTORY
  // =========================================================

  const historyItems = useMemo(() => {
    return [
      ...rides,
      ...parcelDeliveries,
    ].sort(
      (a, b) =>
        getDateValue(
          b.createdAt
        ) -
        getDateValue(
          a.createdAt
        )
    );
  }, [
    rides,
    parcelDeliveries,
  ]);

  // =========================================================
  // STATUS
  // =========================================================

  const getDisplayStatus = (item) => {
    const status = String(
      item.status || ""
    )
      .trim()
      .toLowerCase();

    const journeyStage = Number(
      item.journeyStage
    );

    const statusStep = Number(
      item.statusStep
    );

    // COMPLETED
    if (
      status === "completed" ||
      status === "complete" ||
      status ===
        "destination reached" ||
      status ===
        "destination_reached" ||
      status ===
        "ride completed" ||
      status ===
        "trip completed" ||
      status ===
        "delivery completed" ||
      status ===
        "delivery_completed" ||
      status === "delivered" ||
      status === "parcel delivered" ||
      status === "parcel_delivered" ||
      journeyStage >= 5 ||
      statusStep >= 5
    ) {
      return "Completed";
    }

    // CANCELLED
    if (
      status === "cancelled" ||
      status === "canceled" ||
      status ===
        "cancelled by user" ||
      status ===
        "delivery cancelled" ||
      status ===
        "delivery_cancelled"
    ) {
      return "Cancelled";
    }

    // PARCEL PICKED UP
    if (
      status === "picked up" ||
      status === "picked_up" ||
      status ===
        "parcel picked up" ||
      status ===
        "parcel_picked_up"
    ) {
      return "Parcel Picked Up";
    }

    // PARCEL IN TRANSIT
    if (
      status ===
        "out for delivery" ||
      status ===
        "out_for_delivery" ||
      status ===
        "parcel in transit" ||
      status === "in transit" ||
      status === "in_transit"
    ) {
      return "Out for Delivery";
    }

    // PARCEL ASSIGNED
    if (
      status ===
        "delivery assigned" ||
      status ===
        "delivery_assigned" ||
      status ===
        "rider assigned" ||
      status ===
        "rider_assigned"
    ) {
      return "Delivery Assigned";
    }

    // RIDE DRIVER ARRIVED
    if (
      status ===
        "driver arrived" ||
      status ===
        "driver_arrived"
    ) {
      return "Driver Arrived";
    }

    // RIDE STARTED
    if (
      status ===
        "ride started" ||
      status ===
        "ride_started" ||
      status === "on trip" ||
      status === "on_trip"
    ) {
      return "Ride Started";
    }

    // DRIVER ARRIVING
    if (
      status ===
        "driver arriving" ||
      status ===
        "driver_arriving"
    ) {
      return "Driver Arriving";
    }

    // DRIVER ASSIGNED
    if (
      status ===
        "driver assigned" ||
      status ===
        "driver_assigned"
    ) {
      return "Driver Assigned";
    }

    if (!status) {
      return "Searching for Driver";
    }

    return getSafeText(
      item.status,
      "Searching for Driver"
    );
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (
    status,
    isParcel
  ) => {
    if (status === "Completed") {
      return {
        wrapper:
          "bg-green-500/10 border-green-500/20",
        text:
          "text-green-400",
        icon: "✓",
      };
    }

    if (status === "Cancelled") {
      return {
        wrapper:
          "bg-red-500/10 border-red-500/20",
        text:
          "text-red-400",
        icon: "×",
      };
    }

    if (status === "Ride Started") {
      return {
        wrapper:
          "bg-blue-500/10 border-blue-500/20",
        text:
          "text-blue-400",
        icon: "🚗",
      };
    }

    if (status === "Driver Arrived") {
      return {
        wrapper:
          "bg-purple-500/10 border-purple-500/20",
        text:
          "text-purple-400",
        icon: "📍",
      };
    }

    if (status === "Parcel Picked Up") {
      return {
        wrapper:
          "bg-purple-500/10 border-purple-500/20",
        text:
          "text-purple-400",
        icon: "📦",
      };
    }

    if (status === "Out for Delivery") {
      return {
        wrapper:
          "bg-blue-500/10 border-blue-500/20",
        text:
          "text-blue-400",
        icon: "🛵",
      };
    }

    if (status === "Delivery Assigned") {
      return {
        wrapper:
          "bg-[#FFBE0B]/10 border-[#FFBE0B]/20",
        text:
          "text-[#FFBE0B]",
        icon: "📦",
      };
    }

    if (status === "Driver Assigned") {
      return {
        wrapper:
          "bg-[#FFBE0B]/10 border-[#FFBE0B]/20",
        text:
          "text-[#FFBE0B]",
        icon: "🚕",
      };
    }

    return {
      wrapper:
        "bg-[#FFBE0B]/10 border-[#FFBE0B]/20",
      text:
        "text-[#FFBE0B]",
      icon: isParcel
        ? "📦"
        : "⏱",
    };
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalRides = rides.length;

  const totalParcels =
    parcelDeliveries.length;

  const totalHistoryItems =
    historyItems.length;

  const completedRides =
    historyItems.filter(
      (item) =>
        getDisplayStatus(item) ===
        "Completed"
    ).length;

  const totalSpent =
    historyItems
      .filter((item) => {
        const status =
          getDisplayStatus(item);

        const paymentStatus =
          String(
            item.paymentStatus ||
              ""
          ).toLowerCase();

        return (
          paymentStatus ===
            "paid" ||
          status === "Completed"
        );
      })
      .reduce(
        (total, item) => {
          const amount =
            getFareValue(
              item,
              item.recordType ===
                "parcel"
            );

          return total + amount;
        },
        0
      );

  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authLoading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-4xl animate-pulse">
              🚕
            </div>

            <h2 className="text-2xl font-black mt-6">
              Preparing your journey...
            </h2>

            <p className="text-gray-500 mt-2">
              Please wait.
            </p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // LOGIN REQUIRED
  // =========================================================

  if (!currentUser) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center px-6">
          <div className="relative max-w-md w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-10 text-center">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFBE0B]/10 blur-3xl rounded-full" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-4xl">
                🔐
              </div>

              <h1 className="text-3xl font-black mt-7">
                Login Required
              </h1>

              <p className="text-gray-400 mt-4 leading-relaxed">
                Sign in to view your
                complete RYDO journey
                history.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/login")
                }
                className="mt-8 w-full bg-[#FFBE0B] text-black py-4 rounded-2xl font-black hover:scale-[1.02] transition"
              >
                Login to RYDO →
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl animate-bounce">
              🚗
            </div>

            <h2 className="text-2xl font-black text-[#FFBE0B] mt-6">
              Loading your history...
            </h2>

            <p className="text-gray-500 mt-2">
              Fetching your RYDO rides
              and parcel deliveries.
            </p>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#070A12] text-white pt-28 pb-24 px-5 md:px-8 overflow-hidden">
        {/* Background */}
        <div className="fixed top-40 left-0 w-72 h-72 bg-[#FFBE0B]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="fixed bottom-20 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">

          {/* =================================================
              HERO
          ================================================= */}

          <section className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-7">

              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFBE0B]/20 bg-[#FFBE0B]/5 text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-[#FFBE0B] animate-pulse" />
                  Your RYDO Journey
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight mt-5">
                  Ride{" "}
                  <span className="text-[#FFBE0B]">
                    History
                  </span>
                </h1>

                <p className="text-gray-500 text-lg mt-4 max-w-xl">
                  Every ride, parcel,
                  destination, and
                  journey — all in one
                  place.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/bookride")
                  }
                  className="group flex items-center justify-center gap-3 bg-[#FFBE0B] text-black px-7 py-4 rounded-2xl font-black hover:scale-[1.03] transition shadow-lg shadow-[#FFBE0B]/10"
                >
                  <span className="text-xl">
                    +
                  </span>

                  Book New Ride

                  <span className="group-hover:translate-x-1 transition">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/parcel-delivery"
                    )
                  }
                  className="group flex items-center justify-center gap-3 border border-purple-500/30 bg-purple-500/5 text-purple-400 px-7 py-4 rounded-2xl font-black hover:bg-purple-500/10 hover:scale-[1.03] transition"
                >
                  📦

                  Send Parcel

                  <span className="group-hover:translate-x-1 transition">
                    →
                  </span>
                </button>

              </div>
            </div>
          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400 font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* =================================================
              STATS
          ================================================= */}

          <section className="grid md:grid-cols-4 gap-5 mb-12">

            {/* TOTAL */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] backdrop-blur-xl p-6 hover:border-[#FFBE0B]/30 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                    Total History
                  </p>

                  <h2 className="text-4xl font-black mt-3">
                    {totalHistoryItems}
                  </h2>

                  <p className="text-gray-600 text-sm mt-2">
                    Rides + parcels
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl">
                  📋
                </div>
              </div>
            </div>

            {/* RIDES */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] backdrop-blur-xl p-6 hover:border-blue-500/30 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                    Rides
                  </p>

                  <h2 className="text-4xl font-black mt-3">
                    {totalRides}
                  </h2>

                  <p className="text-gray-600 text-sm mt-2">
                    RYDO rides
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl">
                  🚗
                </div>
              </div>
            </div>

            {/* PARCELS */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] backdrop-blur-xl p-6 hover:border-purple-500/30 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                    Parcels
                  </p>

                  <h2 className="text-4xl font-black mt-3 text-purple-400">
                    {totalParcels}
                  </h2>

                  <p className="text-gray-600 text-sm mt-2">
                    Parcel deliveries
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl">
                  📦
                </div>
              </div>
            </div>

            {/* SPENT */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] backdrop-blur-xl p-6 hover:border-green-500/30 transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                    Total Spent
                  </p>

                  <h2 className="text-4xl font-black mt-3">
                    ₹{totalSpent.toFixed(0)}
                  </h2>

                  <p className="text-gray-600 text-sm mt-2">
                    Rides + deliveries
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-2xl">
                  💳
                </div>
              </div>
            </div>

          </section>

          {/* =================================================
              COMPLETED SUMMARY
          ================================================= */}

          <div className="mb-10 rounded-3xl border border-green-500/10 bg-green-500/[0.03] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                  ✓
                </div>

                <div>
                  <p className="font-black">
                    Completed Journeys
                  </p>

                  <p className="text-gray-500 text-sm">
                    Successfully completed
                    rides and deliveries
                  </p>
                </div>
              </div>

              <p className="text-green-400 text-2xl font-black">
                {completedRides}
              </p>

            </div>
          </div>

          {/* =================================================
              EMPTY
          ================================================= */}

          {historyItems.length === 0 && (
            <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-10 md:p-16 text-center">

              <div className="w-24 h-24 mx-auto rounded-[2rem] bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-5xl">
                🚕
              </div>

              <h2 className="text-3xl md:text-4xl font-black mt-7">
                Your journey starts
                here
              </h2>

              <p className="text-gray-500 max-w-md mx-auto mt-4">
                You haven't booked any
                rides or parcel
                deliveries yet.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">

                <button
                  type="button"
                  onClick={() =>
                    navigate("/bookride")
                  }
                  className="bg-[#FFBE0B] text-black px-8 py-4 rounded-2xl font-black hover:scale-[1.03] transition"
                >
                  Book Your First Ride 🚗
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/parcel-delivery"
                    )
                  }
                  className="border border-purple-500/30 text-purple-400 px-8 py-4 rounded-2xl font-black hover:bg-purple-500/10 transition"
                >
                  Send Your First Parcel 📦
                </button>

              </div>
            </section>
          )}

          {/* =================================================
              HISTORY LIST
          ================================================= */}

          {historyItems.length > 0 && (
            <section>

              <div className="flex items-center justify-between mb-6">

                <div>
                  <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                    Your trips
                  </p>

                  <h2 className="text-2xl md:text-3xl font-black mt-1">
                    Recent Journeys
                  </h2>
                </div>

                <div className="text-gray-600 text-sm font-bold">
                  {historyItems.length}{" "}
                  {historyItems.length === 1
                    ? "item"
                    : "items"}
                </div>

              </div>

              <div className="space-y-6">

                {historyItems.map(
                  (item) => {
                    const isParcel =
                      item.recordType ===
                      "parcel";

                    const recordTitle =
                      isParcel
                        ? "Parcel Delivery"
                        : "Ride";

                    const recordIcon =
                      isParcel
                        ? "📦"
                        : "🚗";

                    const displayStatus =
                      getDisplayStatus(
                        item
                      );

                    const statusStyle =
                      getStatusStyle(
                        displayStatus,
                        isParcel
                      );

                    const isCompleted =
                      displayStatus ===
                      "Completed";

                    const isCancelled =
                      displayStatus ===
                      "Cancelled";

                    // =====================================
                    // LOCATIONS
                    // =====================================

                    const pickupText =
                      getLocationText(
                        item.pickup ||
                          item.senderLocation ||
                          item.pickupLocation ||
                          item.pickupAddress ||
                          item.senderAddress
                      );

                    const destinationText =
                      getLocationText(
                        item.destination ||
                          item.receiverLocation ||
                          item.dropoff ||
                          item.dropLocation ||
                          item.deliveryAddress ||
                          item.receiverAddress ||
                          item.destinationAddress
                      );

                    // =====================================
                    // RIDE
                    // =====================================

                    const rideTypeText =
                      getSafeText(
                        item.rideType ||
                          item.ride,
                        "Ride"
                      );

                    const driverText =
                      getSafeText(
                        item.driver ||
                          item.driverName ||
                          item.riderName ||
                          item.deliveryRider ||
                          item.deliveryRiderName,
                        "Assigning..."
                      );

                    const vehicleText =
                      getSafeText(
                        item.vehicle ||
                          item.vehicleType,
                        "Not assigned"
                      );

                    // =====================================
                    // PARCEL
                    // =====================================

                    const parcelType =
                      getSafeText(
                        item.parcelType ||
                          item.deliveryType ||
                          item.packageType ||
                          item.packageCategory ||
                          item.vehicleType,
                        "Parcel"
                      );

                    const receiverName =
                      getSafeText(
                        item.receiverName ||
                          item.receiver ||
                          item.recipientName ||
                          item.recipient,
                        ""
                      );

                    const senderName =
                      getSafeText(
                        item.senderName ||
                          item.sender,
                        ""
                      );

                    const deliveryAddress =
                      getLocationText(
                        item.deliveryAddress ||
                          item.receiverAddress ||
                          item.dropoffAddress ||
                          item.destination
                      );

                    // =====================================
                    // ID
                    // =====================================

                    const recordId =
                      getSafeText(
                        isParcel
                          ? (
                              item.deliveryId ||
                              item.parcelId ||
                              item.bookingId ||
                              item.deliveryBookingId ||
                              item.firestoreId
                            )
                          : (
                              item.rideId ||
                              item.bookingId ||
                              item.firestoreId
                            ),
                        item.firestoreId
                      );

                    // =====================================
                    // FARE
                    // =====================================

                    const amountValue =
                      getFareValue(
                        item,
                        isParcel
                      );

                    // =====================================
                    // DISTANCE
                    // =====================================

                    const distanceValue =
                      getDistanceValue(
                        item
                      );

                    // =====================================
                    // DURATION
                    // =====================================

                    const durationText =
                      getDurationText(
                        item,
                        isParcel
                      );

                    return (
                      <article
                        key={`${item.recordType}-${item.firestoreId}`}
                        className={`group relative overflow-hidden rounded-[2rem] border bg-white/[0.035] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                          isCompleted
                            ? "border-green-500/20 hover:border-green-500/40"
                            : isCancelled
                            ? "border-red-500/20 hover:border-red-500/40"
                            : isParcel
                            ? "border-purple-500/20 hover:border-purple-500/40"
                            : "border-white/10 hover:border-[#FFBE0B]/30"
                        }`}
                      >

                        {/* ACCENT */}

                        <div
                          className={`h-1 w-full ${
                            isCompleted
                              ? "bg-green-500"
                              : isCancelled
                              ? "bg-red-500"
                              : isParcel
                              ? "bg-purple-500"
                              : "bg-[#FFBE0B]"
                          }`}
                        />

                        <div className="p-6 md:p-8">

                          {/* HEADER */}

                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                            <div className="flex items-center gap-4">

                              <div
                                className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl ${
                                  isParcel
                                    ? "bg-purple-500/10 border-purple-500/20"
                                    : isCompleted
                                    ? "bg-green-500/10 border-green-500/20"
                                    : isCancelled
                                    ? "bg-red-500/10 border-red-500/20"
                                    : "bg-[#FFBE0B]/10 border-[#FFBE0B]/10"
                                }`}
                              >
                                {isParcel
                                  ? recordIcon
                                  : isCompleted
                                  ? "✓"
                                  : isCancelled
                                  ? "×"
                                  : "🚗"}
                              </div>

                              <div>

                                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                  {recordTitle} ID
                                </p>

                                <p className="text-[#FFBE0B] font-black text-lg md:text-xl break-all">
                                  {recordId}
                                </p>

                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black text-gray-300">
                                  {recordIcon}
                                  {recordTitle}
                                </div>

                                <p className="text-gray-500 text-sm mt-2">
                                  {item.rideDate
                                    ? getSafeText(
                                        item.rideDate
                                      )
                                    : item.deliveryDate
                                    ? getSafeText(
                                        item.deliveryDate
                                      )
                                    : formatDate(
                                        item.createdAt
                                      )}

                                  {(item.rideTime ||
                                    item.deliveryTime) &&
                                    ` • ${getSafeText(
                                      item.rideTime ||
                                        item.deliveryTime
                                    )}`}

                                  {!item.rideTime &&
                                    !item.deliveryTime &&
                                    item.createdAt &&
                                    ` • ${formatTime(
                                      item.createdAt
                                    )}`}
                                </p>

                              </div>
                            </div>

                            <div
                              className={`inline-flex items-center gap-2 w-fit px-4 py-2.5 rounded-full border font-black text-sm ${statusStyle.wrapper} ${statusStyle.text}`}
                            >
                              <span>
                                {statusStyle.icon}
                              </span>

                              <span>
                                {displayStatus}
                              </span>
                            </div>

                          </div>

                          {/* COMPLETED */}

                          {isCompleted && (
                            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-5">

                              <div className="flex items-center gap-4">

                                <div className="w-11 h-11 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-xl">
                                  ✓
                                </div>

                                <div>

                                  <p className="font-black text-green-400">
                                    {isParcel
                                      ? "Parcel Delivered"
                                      : "Destination Reached"}
                                  </p>

                                  <p className="text-gray-500 text-sm mt-1">
                                    {isParcel
                                      ? "Your parcel delivery has been successfully completed."
                                      : "Your RYDO ride has been successfully completed."}
                                  </p>

                                </div>

                              </div>

                            </div>
                          )}

                          {/* ROUTE */}

                          <div className="mt-7 rounded-3xl bg-[#05070D] border border-white/5 p-5 md:p-6">

                            <div className="flex gap-4">

                              <div className="flex flex-col items-center pt-1">

                                <div
                                  className={`w-4 h-4 rounded-full border-4 bg-[#05070D] ${
                                    isParcel
                                      ? "border-purple-400"
                                      : "border-[#FFBE0B]"
                                  }`}
                                />

                                <div
                                  className={`w-px h-16 ${
                                    isParcel
                                      ? "bg-gradient-to-b from-purple-400 to-green-400"
                                      : "bg-gradient-to-b from-[#FFBE0B] to-green-400"
                                  }`}
                                />

                                <div className="w-4 h-4 rounded-full border-4 border-green-400 bg-[#05070D]" />

                              </div>

                              <div className="flex-1 min-w-0">

                                <div>
                                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    Pickup
                                  </p>

                                  <p className="font-bold mt-1 break-words">
                                    {pickupText}
                                  </p>
                                </div>

                                <div className="h-10" />

                                <div>
                                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    Destination
                                  </p>

                                  <p className="font-bold mt-1 break-words">
                                    {destinationText}
                                  </p>
                                </div>

                              </div>
                            </div>
                          </div>

                          {/* PARCEL PEOPLE */}

                          {isParcel && (
                            <div className="grid md:grid-cols-2 gap-4 mt-5">

                              <div className="rounded-2xl bg-[#05070D] border border-white/5 p-5">

                                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                  Sender
                                </p>

                                <p className="font-bold mt-2">
                                  👤{" "}
                                  {senderName ||
                                    "Not available"}
                                </p>

                              </div>

                              <div className="rounded-2xl bg-[#05070D] border border-white/5 p-5">

                                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                  Receiver
                                </p>

                                <p className="font-bold mt-2">
                                  👤{" "}
                                  {receiverName ||
                                    "Not available"}
                                </p>

                              </div>

                            </div>
                          )}

                          {/* DETAILS */}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                            {/* TYPE */}

                            <div className="rounded-2xl bg-[#05070D] border border-white/5 p-4">

                              <p className="text-gray-600 text-xs font-bold uppercase">
                                {isParcel
                                  ? "Parcel Type"
                                  : "Ride Type"}
                              </p>

                              <p className="font-bold mt-2">
                                {isParcel
                                  ? `📦 ${parcelType}`
                                  : `🚖 ${rideTypeText}`}
                              </p>

                            </div>

                            {/* DRIVER */}

                            <div className="rounded-2xl bg-[#05070D] border border-white/5 p-4">

                              <p className="text-gray-600 text-xs font-bold uppercase">
                                {isParcel
                                  ? "Delivery Rider"
                                  : "Driver"}
                              </p>

                              <p className="font-bold mt-2 truncate">
                                {isParcel
                                  ? `🛵 ${driverText}`
                                  : `👨 ${driverText}`}
                              </p>

                            </div>

                            {/* VEHICLE / ADDRESS */}

                            <div className="rounded-2xl bg-[#05070D] border border-white/5 p-4">

                              <p className="text-gray-600 text-xs font-bold uppercase">
                                {isParcel
                                  ? "Delivery Address"
                                  : "Vehicle"}
                              </p>

                              <p className="font-bold mt-2 truncate">
                                {isParcel
                                  ? `📍 ${
                                      deliveryAddress ||
                                      "Not available"
                                    }`
                                  : `🚗 ${vehicleText}`}
                              </p>

                            </div>

                            {/* FARE */}

                            <div
                              className={`rounded-2xl bg-[#05070D] border p-4 ${
                                isParcel
                                  ? "border-purple-500/20"
                                  : "border-white/5"
                              }`}
                            >

                              <p className="text-gray-600 text-xs font-bold uppercase">
                                {isParcel
                                  ? "Delivery Fare"
                                  : "Fare"}
                              </p>

                              <p
                                className={`font-black text-lg mt-1 ${
                                  isParcel
                                    ? "text-purple-400"
                                    : "text-[#FFBE0B]"
                                }`}
                              >
                                ₹
                                {amountValue.toFixed(
                                  0
                                )}
                              </p>

                              {isParcel && (
                                <p className="text-gray-600 text-xs mt-1">
                                  Delivery charge
                                </p>
                              )}

                            </div>

                          </div>

                          {/* =================================================
                              DISTANCE + DURATION
                          ================================================= */}

                          <div className="grid md:grid-cols-2 gap-4 mt-4">

                            {/* DISTANCE */}

                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                              <div className="flex items-center justify-between">

                                <div>

                                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    Distance
                                  </p>

                                  <p className="font-black text-lg mt-2">
                                    📍{" "}
                                    {distanceValue >
                                    0
                                      ? `${distanceValue.toFixed(
                                          1
                                        )} km`
                                      : "Not available"}
                                  </p>

                                </div>

                                <div className="text-2xl">
                                  🛣️
                                </div>

                              </div>

                            </div>

                            {/* DURATION */}

                            <div
                              className={`rounded-2xl border p-5 ${
                                isParcel
                                  ? "border-purple-500/20 bg-purple-500/[0.04]"
                                  : "border-white/5 bg-white/[0.02]"
                              }`}
                            >

                              <div className="flex items-center justify-between">

                                <div>

                                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    {isParcel
                                      ? "Delivery Duration"
                                      : "Ride Duration"}
                                  </p>

                                  <p
                                    className={`font-black text-lg mt-2 ${
                                      isParcel
                                        ? "text-purple-400"
                                        : "text-white"
                                    }`}
                                  >
                                    ⏱️{" "}
                                    {durationText}
                                  </p>

                                  {isParcel &&
                                    durationText !==
                                      "Not available" && (
                                      <p className="text-gray-600 text-xs mt-2">
                                        Estimated travel time
                                      </p>
                                    )}

                                </div>

                                <div className="text-2xl">
                                  🕐
                                </div>

                              </div>

                            </div>

                          </div>

                          {/* =================================================
                              PAYMENT
                          ================================================= */}

                          <div className="grid md:grid-cols-2 gap-4 mt-4">

                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                              <div className="flex items-center justify-between">

                                <div>

                                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                    Payment
                                  </p>

                                  <p className="font-bold mt-2">
                                    💳{" "}
                                    {getSafeText(
                                      item.paymentStatus,
                                      "Pending"
                                    )}
                                  </p>

                                </div>

                                <div className="text-right">

                                  <p className="text-gray-600 text-xs">
                                    Method
                                  </p>

                                  <p className="text-sm font-bold mt-1">
                                    {getSafeText(
                                      item.paymentMethod,
                                      "Not specified"
                                    )}
                                  </p>

                                </div>

                              </div>

                            </div>

                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

                              <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                {isParcel
                                  ? "Delivery Status"
                                  : "Journey Status"}
                              </p>

                              <p
                                className={`font-black mt-2 ${
                                  isCompleted
                                    ? "text-green-400"
                                    : isCancelled
                                    ? "text-red-400"
                                    : "text-[#FFBE0B]"
                                }`}
                              >
                                {isCompleted
                                  ? isParcel
                                    ? "✓ Parcel Delivered"
                                    : "✓ Destination Reached"
                                  : isCancelled
                                  ? isParcel
                                    ? "✕ Delivery Cancelled"
                                    : "✕ Ride Cancelled"
                                  : displayStatus}
                              </p>

                            </div>

                          </div>

                          {/* =================================================
                              OTP
                          ================================================= */}

                          {item.otp && (
                            <div className="mt-5 rounded-2xl border border-[#FFBE0B]/20 bg-[#FFBE0B]/5 p-5">

                              <div className="flex items-center justify-between">

                                <div>

                                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    {isParcel
                                      ? "Delivery OTP"
                                      : "Ride OTP"}
                                  </p>

                                  <p className="text-3xl font-black text-[#FFBE0B] tracking-[0.3em] mt-2">
                                    {getSafeText(
                                      item.otp
                                    )}
                                  </p>

                                </div>

                                <div className="text-3xl">
                                  🔐
                                </div>

                              </div>

                            </div>
                          )}

                          {/* =================================================
                              COMPLETION DATE
                          ================================================= */}

                          {isCompleted &&
                            (
                              item.completedAt ||
                              item.deliveredAt
                            ) && (
                              <div className="mt-5 rounded-2xl border border-green-500/10 bg-green-500/[0.03] p-4">

                                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                  {isParcel
                                    ? "Delivered At"
                                    : "Completed At"}
                                </p>

                                <p className="text-green-400 font-bold mt-2">
                                  {formatDate(
                                    item.completedAt ||
                                      item.deliveredAt
                                  )}{" "}
                                  •{" "}
                                  {formatTime(
                                    item.completedAt ||
                                      item.deliveredAt
                                  )}
                                </p>

                              </div>
                            )}

                          {/* =================================================
                              CANCELLED DATE
                          ================================================= */}

                          {isCancelled &&
                            item.cancelledAt && (
                              <div className="mt-5 rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-4">

                                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">
                                  Cancelled At
                                </p>

                                <p className="text-red-400 font-bold mt-2">
                                  {formatDate(
                                    item.cancelledAt
                                  )}{" "}
                                  •{" "}
                                  {formatTime(
                                    item.cancelledAt
                                  )}
                                </p>

                              </div>
                            )}

                          {/* =================================================
                              DETAILS BUTTON
                          ================================================= */}

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                isParcel
                                  ? `/parcel-status/${item.firestoreId}`
                                  : `/ride-details/${item.firestoreId}`
                              )
                            }
                            className={`mt-6 w-full group/button py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.01] transition ${
                              isParcel
                                ? "bg-purple-500 text-white"
                                : "bg-[#FFBE0B] text-black"
                            }`}
                          >
                            {isParcel
                              ? "Track Parcel Delivery"
                              : "View Complete Ride Details"}

                            <span className="group-hover/button:translate-x-1 transition">
                              →
                            </span>
                          </button>

                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

export default RideHistory;