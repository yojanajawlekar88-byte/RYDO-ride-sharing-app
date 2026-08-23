import { useEffect, useMemo, useState } from "react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// ==========================================
// DRIVER ID
// ==========================================

const DEFAULT_DRIVER_ID = "rahul-driver";

// ==========================================
// DRIVER DASHBOARD
// ==========================================

function DriverDashboard() {
  // ========================================
  // DRIVER
  // ========================================

  const [driverId, setDriverId] = useState(
    DEFAULT_DRIVER_ID
  );

  const [driverLocation, setDriverLocation] =
    useState(null);

  const [gpsActive, setGpsActive] =
    useState(false);

  const [gpsError, setGpsError] =
    useState("");

  const [lastGpsUpdate, setLastGpsUpdate] =
    useState(null);

  // ========================================
  // RIDES
  // ========================================

  const [rides, setRides] = useState([]);

  const [ridesLoading, setRidesLoading] =
    useState(true);

  // ========================================
  // PARCELS
  // ========================================

  const [parcels, setParcels] =
    useState([]);

  const [parcelsLoading, setParcelsLoading] =
    useState(true);

  // ========================================
  // AUTH DRIVER
  // ========================================

  useEffect(() => {
    const unsubscribe =
      auth.onAuthStateChanged((user) => {
        if (user?.uid) {
          console.log(
            "Authenticated driver:",
            user.uid
          );

          setDriverId(user.uid);
        } else {
          console.log(
            "No authenticated driver. Using:",
            DEFAULT_DRIVER_ID
          );

          setDriverId(DEFAULT_DRIVER_ID);
        }
      });

    return () => unsubscribe();
  }, []);

  // ========================================
  // REAL GPS TRACKING
  // ========================================

  useEffect(() => {
    if (!driverId) return;

    if (!navigator.geolocation) {
      setGpsError(
        "Geolocation is not supported by this browser."
      );

      setGpsActive(false);

      return;
    }

    console.log(
      "Starting REAL GPS tracking for:",
      driverId
    );

    setGpsError("");

    const watchId =
      navigator.geolocation.watchPosition(
        async (position) => {
          const {
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          } = position.coords;

          const lat = Number(latitude);
          const lng = Number(longitude);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
          ) {
            console.error(
              "Invalid GPS coordinates:",
              position.coords
            );

            return;
          }

          console.log(
            "REAL GPS LOCATION:",
            lat,
            lng
          );

          const locationData = {
            lat,
            lng,
            accuracy:
              Number.isFinite(
                Number(accuracy)
              )
                ? Number(accuracy)
                : null,
          };

          setDriverLocation(
            locationData
          );

          setGpsActive(true);

          setGpsError("");

          setLastGpsUpdate(
            new Date()
          );

          // ==================================
          // SAVE DRIVER GPS
          // ==================================

          try {
            const driverRef = doc(
              db,
              "drivers",
              driverId
            );

            await setDoc(
              driverRef,
              {
                driverId,

                isOnline: true,

                // Main location object
                location: {
                  lat,
                  lng,
                  accuracy:
                    Number.isFinite(
                      Number(accuracy)
                    )
                      ? Number(accuracy)
                      : null,
                },

                // Also save flat values
                latitude: lat,
                longitude: lng,

                accuracy:
                  Number.isFinite(
                    Number(accuracy)
                  )
                    ? Number(accuracy)
                    : null,

                speed:
                  speed != null
                    ? Number(speed)
                    : null,

                heading:
                  heading != null
                    ? Number(heading)
                    : null,

                lastLocationUpdate:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            console.log(
              "Driver GPS saved to Firestore"
            );
          } catch (error) {
            console.error(
              "Driver GPS Firestore error:",
              error
            );

            setGpsError(
              "GPS received, but could not save it to Firestore."
            );
          }
        },

        (error) => {
          console.error(
            "REAL GPS ERROR:",
            error
          );

          setGpsActive(false);

          if (error.code === 1) {
            setGpsError(
              "Location permission was denied. Please allow location access."
            );
          } else if (
            error.code === 2
          ) {
            setGpsError(
              "Your device location is unavailable."
            );
          } else if (
            error.code === 3
          ) {
            setGpsError(
              "GPS request timed out. Waiting for another GPS update..."
            );
          } else {
            setGpsError(
              "Unable to get your current GPS location."
            );
          }
        },

        {
          enableHighAccuracy: true,

          maximumAge: 2000,

          timeout: 15000,
        }
      );

    return () => {
      console.log(
        "Stopping GPS watcher"
      );

      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [driverId]);

  // ========================================
  // REAL-TIME RIDES
  // ========================================

  useEffect(() => {
    if (!driverId) return;

    setRidesLoading(true);

    const ridesQuery = query(
      collection(db, "rides"),
      where(
        "driverId",
        "==",
        driverId
      )
    );

    const unsubscribe = onSnapshot(
      ridesQuery,
      (snapshot) => {
        const rideList =
          snapshot.docs.map(
            (rideDoc) => ({
              id: rideDoc.id,
              ...rideDoc.data(),
            })
          );

        console.log(
          "LIVE RIDES:",
          rideList
        );

        setRides(rideList);

        setRidesLoading(false);
      },

      (error) => {
        console.error(
          "Ride realtime error:",
          error
        );

        setRidesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driverId]);

  // ========================================
  // REAL-TIME PARCELS
  // ========================================

  useEffect(() => {
    if (!driverId) return;

    setParcelsLoading(true);

    const parcelsQuery = query(
      collection(
        db,
        "parcelDeliveries"
      ),
      where(
        "driverId",
        "==",
        driverId
      )
    );

    const unsubscribe = onSnapshot(
      parcelsQuery,
      (snapshot) => {
        const parcelList =
          snapshot.docs.map(
            (parcelDoc) => ({
              id: parcelDoc.id,
              ...parcelDoc.data(),
            })
          );

        console.log(
          "LIVE PARCELS:",
          parcelList
        );

        setParcels(parcelList);

        setParcelsLoading(false);
      },

      (error) => {
        console.error(
          "Parcel realtime error:",
          error
        );

        setParcelsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driverId]);

  // ========================================
  // ACTIVE RIDES
  // ========================================

  const activeRides = useMemo(() => {
    return rides.filter(
      (ride) =>
        ride.status !== "Completed" &&
        ride.status !== "Cancelled"
    );
  }, [rides]);

  // ========================================
  // ACTIVE PARCELS
  // ========================================

  const activeParcels =
    useMemo(() => {
      return parcels.filter(
        (parcel) =>
          parcel.status !==
            "Delivered" &&
          parcel.status !==
            "Cancelled"
      );
    }, [parcels]);

  // ========================================
  // UPDATE ACTIVE RIDE GPS
  // ========================================

  useEffect(() => {
    if (!driverLocation) return;

    if (activeRides.length === 0) {
      return;
    }

    const updateRideLocations =
      async () => {
        for (const ride of activeRides) {
          try {
            const rideRef = doc(
              db,
              "rides",
              ride.id
            );

            await setDoc(
              rideRef,
              {
                driverLocation: {
                  lat: driverLocation.lat,
                  lng: driverLocation.lng,
                  accuracy:
                    driverLocation.accuracy ??
                    null,
                },

                driverLat:
                  driverLocation.lat,

                driverLng:
                  driverLocation.lng,

                driverLocationUpdatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            console.log(
              "Ride GPS updated:",
              ride.id
            );
          } catch (error) {
            console.error(
              "Ride GPS update error:",
              error
            );
          }
        }
      };

    updateRideLocations();
  }, [
    driverLocation,
    activeRides,
  ]);

  // ========================================
  // UPDATE ACTIVE PARCEL GPS
  // ========================================

  useEffect(() => {
    if (!driverLocation) return;

    if (activeParcels.length === 0) {
      return;
    }

    const updateParcelLocations =
      async () => {
        for (const parcel of activeParcels) {
          try {
            const parcelRef = doc(
              db,
              "parcelDeliveries",
              parcel.id
            );

            await setDoc(
              parcelRef,
              {
                driverLocation: {
                  lat: driverLocation.lat,
                  lng: driverLocation.lng,
                  accuracy:
                    driverLocation.accuracy ??
                    null,
                },

                driverLat:
                  driverLocation.lat,

                driverLng:
                  driverLocation.lng,

                driverLocationUpdatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            console.log(
              "Parcel GPS updated:",
              parcel.id
            );
          } catch (error) {
            console.error(
              "Parcel GPS update error:",
              error
            );
          }
        }
      };

    updateParcelLocations();
  }, [
    driverLocation,
    activeParcels,
  ]);

  // ========================================
  // STATS
  // ========================================

  const completedRides =
    rides.filter(
      (ride) =>
        ride.status === "Completed"
    ).length;

  const completedParcels =
    parcels.filter(
      (parcel) =>
        parcel.status === "Delivered"
    ).length;

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-[#0B1020] text-white px-6 py-10">

      <div className="max-w-7xl mx-auto">

        {/* ==================================
            HEADER
        ================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

          <div>

            <p className="text-[#FFBE0B] text-sm font-black uppercase tracking-widest">
              RYDO
            </p>

            <h1 className="text-4xl md:text-5xl font-black text-[#FFBE0B] mt-2">
              Driver Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Real-time rides, parcel deliveries
              and live GPS tracking.
            </p>

          </div>

          <div
            className={`rounded-2xl px-5 py-3 border ${
              gpsActive
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-yellow-500/10 border-yellow-500/20"
            }`}
          >

            <span
              className={`font-bold ${
                gpsActive
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >
              {gpsActive
                ? "🟢 GPS LIVE"
                : "🟡 GPS WAITING"}
            </span>

          </div>

        </div>

        {/* ==================================
            GPS PANEL
        ================================== */}

        <div className="bg-[#1E293B] rounded-3xl p-6 md:p-8 mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-[#FFBE0B] text-sm font-black uppercase tracking-widest">
                Live GPS
              </p>

              <h2 className="text-2xl md:text-3xl font-black mt-2">
                Driver Location
              </h2>

              <p className="text-gray-400 mt-2">
                Your device GPS is sent to
                Firestore automatically.
              </p>

            </div>

            <div
              className={`px-5 py-3 rounded-full font-black ${
                gpsActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {gpsActive
                ? "📍 Location Active"
                : "📍 Waiting for GPS"}
            </div>

          </div>

          {/* GPS ERROR */}

          {gpsError && (
            <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 font-bold">
              ⚠️ {gpsError}
            </div>
          )}

          {/* GPS DATA */}

          {driverLocation ? (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

              <div className="bg-black/20 rounded-2xl p-5">

                <p className="text-gray-500 text-sm">
                  Latitude
                </p>

                <p className="text-xl font-black mt-2">
                  {driverLocation.lat.toFixed(
                    6
                  )}
                </p>

              </div>

              <div className="bg-black/20 rounded-2xl p-5">

                <p className="text-gray-500 text-sm">
                  Longitude
                </p>

                <p className="text-xl font-black mt-2">
                  {driverLocation.lng.toFixed(
                    6
                  )}
                </p>

              </div>

              <div className="bg-black/20 rounded-2xl p-5">

                <p className="text-gray-500 text-sm">
                  GPS Accuracy
                </p>

                <p className="text-xl font-black mt-2">
                  ±
                  {driverLocation.accuracy
                    ? Math.round(
                        driverLocation.accuracy
                      )
                    : "—"}
                  m
                </p>

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-400 font-bold">
              📍 Waiting for your device to
              provide its GPS location...
            </div>

          )}

          {/* LAST UPDATE */}

          {lastGpsUpdate && (
            <p className="text-gray-500 text-sm mt-4">
              Last GPS update:{" "}
              {lastGpsUpdate.toLocaleTimeString()}
            </p>
          )}

        </div>

        {/* ==================================
            STATS
        ================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

          <div className="bg-[#1E293B] rounded-3xl p-6">

            <p className="text-gray-400">
              Total Rides
            </p>

            <h2 className="text-4xl font-black mt-3 text-[#FFBE0B]">
              {rides.length}
            </h2>

          </div>

          <div className="bg-[#1E293B] rounded-3xl p-6">

            <p className="text-gray-400">
              Active Rides
            </p>

            <h2 className="text-4xl font-black mt-3">
              {activeRides.length}
            </h2>

          </div>

          <div className="bg-[#1E293B] rounded-3xl p-6">

            <p className="text-gray-400">
              Completed Rides
            </p>

            <h2 className="text-4xl font-black mt-3 text-emerald-400">
              {completedRides}
            </h2>

          </div>

          <div className="bg-[#1E293B] rounded-3xl p-6">

            <p className="text-gray-400">
              Active Parcels
            </p>

            <h2 className="text-4xl font-black mt-3 text-[#FFBE0B]">
              {activeParcels.length}
            </h2>

          </div>

          <div className="bg-[#1E293B] rounded-3xl p-6">

            <p className="text-gray-400">
              Delivered Parcels
            </p>

            <h2 className="text-4xl font-black mt-3 text-emerald-400">
              {completedParcels}
            </h2>

          </div>

        </div>

        {/* ==================================
            LIVE GPS CONNECTION
        ================================== */}

        <div className="bg-[#1E293B] rounded-3xl p-6 md:p-8 mb-8">

          <h2 className="text-2xl md:text-3xl font-black text-[#FFBE0B]">
            Live Tracking Connection
          </h2>

          <p className="text-gray-400 mt-2">
            Firestore automatically receives
            your GPS and sends it to customers.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="bg-black/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Driver ID
              </p>

              <p className="font-black mt-2 break-all">
                {driverId}
              </p>

            </div>

            <div className="bg-black/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Ride GPS
              </p>

              <p className="font-black mt-2 text-emerald-400">
                {activeRides.length > 0
                  ? "✓ CONNECTED"
                  : "NO ACTIVE RIDE"}
              </p>

            </div>

            <div className="bg-black/20 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Parcel GPS
              </p>

              <p className="font-black mt-2 text-emerald-400">
                {activeParcels.length > 0
                  ? "✓ CONNECTED"
                  : "NO ACTIVE PARCEL"}
              </p>

            </div>

          </div>

        </div>

        {/* ==================================
            RIDE REQUESTS
        ================================== */}

        <div className="bg-[#1E293B] rounded-3xl p-6 md:p-8 mb-8">

          <div className="mb-8">

            <h2 className="text-2xl md:text-3xl font-black text-[#FFBE0B]">
              Ride Requests
            </h2>

            <p className="text-gray-400 mt-1">
              Live ride information from
              Firestore.
            </p>

          </div>

          {ridesLoading ? (

            <div className="text-center py-12 text-gray-400">
              Loading rides...
            </div>

          ) : rides.length === 0 ? (

            <div className="text-center py-12">

              <div className="text-5xl mb-4">
                🚕
              </div>

              <h3 className="text-xl font-bold">
                No rides yet
              </h3>

              <p className="text-gray-400 mt-2">
                New ride requests will appear
                automatically.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {rides.map((ride) => (

                <div
                  key={ride.id}
                  className="border border-white/10 bg-[#111827] rounded-2xl p-5"
                >

                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">

                    <div>

                      <p className="text-sm text-gray-500">
                        Ride ID
                      </p>

                      <p className="font-bold break-all">
                        {ride.id}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Pickup
                      </p>

                      <p className="font-bold">
                        {ride.pickup ||
                          ride.pickupAddress ||
                          "Not available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Destination
                      </p>

                      <p className="font-bold">
                        {ride.destination ||
                          ride.drop ||
                          ride.destinationAddress ||
                          "Not available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Fare
                      </p>

                      <p className="font-black text-[#FFBE0B]">
                        ₹
                        {ride.fare ||
                          ride.paidAmount ||
                          0}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        GPS
                      </p>

                      <p className="font-bold text-emerald-400">
                        {ride.driverLocation
                          ? "🟢 LIVE"
                          : "🟡 WAITING"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Status
                      </p>

                      <span
                        className={`inline-block mt-1 px-4 py-2 rounded-full text-sm font-bold ${
                          ride.status ===
                          "Completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : ride.status ===
                              "Cancelled"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#FFBE0B]/10 text-[#FFBE0B]"
                        }`}
                      >
                        {ride.status ||
                          "Searching"}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* ==================================
            PARCEL DELIVERIES
        ================================== */}

        <div className="bg-[#1E293B] rounded-3xl p-6 md:p-8">

          <div className="mb-8">

            <h2 className="text-2xl md:text-3xl font-black text-[#FFBE0B]">
              Parcel Deliveries
            </h2>

            <p className="text-gray-400 mt-1">
              Live parcel information from
              Firestore.
            </p>

          </div>

          {parcelsLoading ? (

            <div className="text-center py-12 text-gray-400">
              Loading parcels...
            </div>

          ) : parcels.length === 0 ? (

            <div className="text-center py-12">

              <div className="text-5xl mb-4">
                📦
              </div>

              <h3 className="text-xl font-bold">
                No parcels yet
              </h3>

              <p className="text-gray-400 mt-2">
                New parcel deliveries assigned
                to you will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {parcels.map((parcel) => (

                <div
                  key={parcel.id}
                  className="border border-white/10 bg-[#111827] rounded-2xl p-5"
                >

                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">

                    <div>

                      <p className="text-sm text-gray-500">
                        Parcel ID
                      </p>

                      <p className="font-bold break-all">
                        {parcel.parcelId ||
                          parcel.id}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Pickup
                      </p>

                      <p className="font-bold">
                        {parcel.pickup?.address ||
                          parcel.pickupAddress ||
                          parcel.pickup ||
                          "Not available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Destination
                      </p>

                      <p className="font-bold">
                        {parcel.destination?.address ||
                          parcel.destinationAddress ||
                          parcel.destination ||
                          "Not available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Fare
                      </p>

                      <p className="font-black text-[#FFBE0B]">
                        ₹
                        {parcel.fare ||
                          parcel.fareAmount ||
                          0}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        GPS
                      </p>

                      <p className="font-bold text-emerald-400">
                        {parcel.driverLocation
                          ? "🟢 LIVE"
                          : "🟡 WAITING"}
                      </p>

                    </div>

                    <div>

                      <p className="text-sm text-gray-500">
                        Status
                      </p>

                      <span
                        className={`inline-block mt-1 px-4 py-2 rounded-full text-sm font-bold ${
                          parcel.status ===
                          "Delivered"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : parcel.status ===
                              "Cancelled"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#FFBE0B]/10 text-[#FFBE0B]"
                        }`}
                      >
                        {parcel.status ||
                          "Driver Assigned"}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default DriverDashboard;