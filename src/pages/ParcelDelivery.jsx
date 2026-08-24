import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import LocationAutocomplete from "../components/LocationAutocomplete";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

function ParcelDelivery() {
  const navigate = useNavigate();

  // =========================================================
  // LOCATIONS
  // =========================================================

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);

  // =========================================================
  // SENDER
  // =========================================================

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  // =========================================================
  // RECEIVER
  // =========================================================

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  // =========================================================
  // PARCEL
  // =========================================================

  const [parcelDetails, setParcelDetails] = useState("");

  // =========================================================
  // DELIVERY OTP
  // =========================================================

  const [deliveryOtp, setDeliveryOtp] = useState("");

  // =========================================================
  // DELIVERY
  // =========================================================

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // =========================================================
  // ROUTE
  // =========================================================

  const [distanceKm, setDistanceKm] = useState(0);
  const [routeTimeMinutes, setRouteTimeMinutes] = useState(0);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // =========================================================
  // PAYMENT
  // =========================================================

  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // =========================================================
  // CONFIRMATION
  // =========================================================

  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // =========================================================
  // GENERATE 4-DIGIT DELIVERY OTP
  // =========================================================

  const generateDeliveryOtp = () => {
    return String(
      Math.floor(1000 + Math.random() * 9000)
    );
  };

  // =========================================================
  // DELIVERY OPTIONS
  // =========================================================

  const deliveryRides = useMemo(
    () => [
      {
        id: "bike",
        name: "Bike Delivery",
        icon: "🏍️",
        badge: "FASTEST",
        description: "Best for small and urgent parcels",

        driverId: "rahul-driver",
        driver: "Rahul Sharma",
        driverPhone: "9876543210",

        vehicle: "MH 12 AB 1234",
        arrival: "4 Minutes",

        baseFare: 40,
        perKm: 12,
      },

      {
        id: "scooter",
        name: "Scooter Delivery",
        icon: "🛵",
        badge: "POPULAR",
        description: "Perfect for everyday deliveries",

        driverId: "amit-driver",
        driver: "Amit Patil",
        driverPhone: "9876543211",

        vehicle: "MH 14 CD 5678",
        arrival: "6 Minutes",

        baseFare: 50,
        perKm: 15,
      },

      {
        id: "car",
        name: "Car Delivery",
        icon: "🚗",
        badge: "PREMIUM",
        description: "Extra space and protection",

        driverId: "priya-driver",
        driver: "Priya Singh",
        driverPhone: "9876543212",

        vehicle: "MH 16 EF 9012",
        arrival: "8 Minutes",

        baseFare: 70,
        perKm: 20,
      },
    ],
    []
  );

  // =========================================================
  // WALLET SYNC
  // =========================================================

  useEffect(() => {
    let unsubscribeWallet = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeWallet) {
        unsubscribeWallet();
        unsubscribeWallet = null;
      }

      if (!user) {
        setWalletBalance(0);
        return;
      }

      const userRef = doc(db, "users", user.uid);

      unsubscribeWallet = onSnapshot(
        userRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setWalletBalance(0);
            return;
          }

          const data = snapshot.data();

          const balance =
            typeof data.wallet === "number"
              ? data.wallet
              : Number(data.wallet) || 0;

          setWalletBalance(
            Number.isFinite(balance) ? balance : 0
          );
        },
        (walletError) => {
          console.error("WALLET SYNC ERROR:", walletError);
          setWalletBalance(0);
        }
      );
    });

    return () => {
      if (unsubscribeWallet) {
        unsubscribeWallet();
      }

      unsubscribeAuth();
    };
  }, []);

  // =========================================================
  // ADDRESS
  // =========================================================

  const getLocationAddress = (location) => {
    if (!location) return "";

    return (
      location.address ||
      location.formatted ||
      location.name ||
      location.properties?.formatted ||
      location.properties?.address_line1 ||
      location.properties?.address_line2 ||
      ""
    );
  };

  // =========================================================
  // COORDINATES
  // =========================================================

  const getCoordinates = (location) => {
    if (!location) {
      return {
        lat: NaN,
        lng: NaN,
      };
    }

    let lat = Number(
      location?.lat ??
        location?.latitude ??
        location?.properties?.lat
    );

    let lng = Number(
      location?.lng ??
        location?.lon ??
        location?.longitude ??
        location?.properties?.lon
    );

    if (
      (!Number.isFinite(lat) || !Number.isFinite(lng)) &&
      Array.isArray(location?.geometry?.coordinates)
    ) {
      const coordinates = location.geometry.coordinates;

      if (coordinates.length >= 2) {
        lng = Number(coordinates[0]);
        lat = Number(coordinates[1]);
      }
    }

    if (
      (!Number.isFinite(lat) || !Number.isFinite(lng)) &&
      Array.isArray(location?.coordinates)
    ) {
      if (location.coordinates.length >= 2) {
        lng = Number(location.coordinates[0]);
        lat = Number(location.coordinates[1]);
      }
    }

    return {
      lat,
      lng,
    };
  };

  // =========================================================
  // VALIDATE COORDINATES
  // =========================================================

  const validateCoordinates = (coordinates, label) => {
    const { lat, lng } = coordinates;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(
        `${label} coordinates are missing. Please select the location directly from the suggestions.`
      );
    }

    if (lat < -90 || lat > 90) {
      throw new Error(
        `${label} latitude is invalid: ${lat}`
      );
    }

    if (lng < -180 || lng > 180) {
      throw new Error(
        `${label} longitude is invalid: ${lng}`
      );
    }

    return true;
  };

  // =========================================================
  // RESET DELIVERY OPTIONS
  // =========================================================

  const resetDeliveryOptions = () => {
    setDeliveryOptions([]);
    setSelectedDelivery(null);
    setPaymentComplete(false);
    setPaymentProcessing(false);
    setDistanceKm(0);
    setRouteTimeMinutes(0);
    setRouteGeometry(null);

    // Generate a new OTP only when a delivery vehicle
    // is selected. Clear the old one here.
    setDeliveryOtp("");
  };

  // =========================================================
  // RESET EVERYTHING
  // =========================================================

  const resetEverything = () => {
    setPickup(null);
    setDestination(null);

    setSenderName("");
    setSenderPhone("");

    setReceiverName("");
    setReceiverPhone("");

    setParcelDetails("");

    setDeliveryOptions([]);
    setSelectedDelivery(null);

    setDistanceKm(0);
    setRouteTimeMinutes(0);
    setRouteGeometry(null);

    setPaymentComplete(false);
    setPaymentProcessing(false);

    setPaymentMethod("wallet");

    // Reset OTP for new delivery
    setDeliveryOtp("");

    setError("");
    setIsConfirming(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // ROAD ROUTE
  // =========================================================

  const getRoadRoute = async (
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng
  ) => {
    if (!GEOAPIFY_API_KEY) {
      throw new Error(
        "Geoapify API key is missing. Check your .env file."
      );
    }

    validateCoordinates(
      {
        lat: pickupLat,
        lng: pickupLng,
      },
      "Pickup"
    );

    validateCoordinates(
      {
        lat: destinationLat,
        lng: destinationLng,
      },
      "Destination"
    );

    const pickupWaypoint =
      `${pickupLat},${pickupLng}`;

    const destinationWaypoint =
      `${destinationLat},${destinationLng}`;

    const waypoints =
      `${pickupWaypoint}|${destinationWaypoint}`;

    const url =
      `https://api.geoapify.com/v1/routing` +
      `?waypoints=${encodeURIComponent(
        waypoints
      )}` +
      `&mode=drive` +
      `&type=balanced` +
      `&units=metric` +
      `&format=geojson` +
      `&apiKey=${GEOAPIFY_API_KEY}`;

    const response = await fetch(url);

    let data = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Geoapify returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Route calculation failed (${response.status}).`
      );
    }

    if (
      !data?.features ||
      !Array.isArray(data.features) ||
      data.features.length === 0
    ) {
      throw new Error(
        "Geoapify could not find a road route between these locations."
      );
    }

    const route = data.features[0];

    const distanceMeters = Number(
      route?.properties?.distance
    );

    const timeSeconds = Number(
      route?.properties?.time
    );

    if (
      !Number.isFinite(distanceMeters) ||
      distanceMeters <= 0
    ) {
      throw new Error(
        "Geoapify returned an invalid road distance."
      );
    }

    if (
      !Number.isFinite(timeSeconds) ||
      timeSeconds <= 0
    ) {
      throw new Error(
        "Geoapify returned an invalid travel time."
      );
    }

    const calculatedDistanceKm =
      distanceMeters / 1000;

    const calculatedTimeMinutes = Math.max(
      1,
      Math.ceil(timeSeconds / 60)
    );

    return {
      distanceKm: Number(
        calculatedDistanceKm.toFixed(2)
      ),
      timeMinutes: calculatedTimeMinutes,
      geometry: route?.geometry || null,
    };
  };

  // =========================================================
  // FIND DELIVERY
  // =========================================================

  const findDelivery = async () => {
    setError("");
    setSelectedDelivery(null);
    setPaymentComplete(false);
    setDeliveryOptions([]);

    // Clear previous OTP because a new route/search
    // is being started.
    setDeliveryOtp("");

    if (!pickup) {
      setError(
        "Please select a pickup location from the suggestions."
      );
      return;
    }

    if (!destination) {
      setError(
        "Please select a delivery destination from the suggestions."
      );
      return;
    }

    if (!senderName.trim()) {
      setError("Please enter sender name.");
      return;
    }

    if (!/^[0-9]{10}$/.test(senderPhone)) {
      setError(
        "Sender mobile number must be exactly 10 digits."
      );
      return;
    }

    if (!receiverName.trim()) {
      setError("Please enter receiver name.");
      return;
    }

    if (!/^[0-9]{10}$/.test(receiverPhone)) {
      setError(
        "Receiver mobile number must be exactly 10 digits."
      );
      return;
    }

    if (!parcelDetails.trim()) {
      setError("Please enter parcel details.");
      return;
    }

    const pickupCoordinates =
      getCoordinates(pickup);

    const destinationCoordinates =
      getCoordinates(destination);

    try {
      validateCoordinates(
        pickupCoordinates,
        "Pickup"
      );

      validateCoordinates(
        destinationCoordinates,
        "Destination"
      );
    } catch (coordinateError) {
      setError(coordinateError.message);
      return;
    }

    const pickupLat = pickupCoordinates.lat;
    const pickupLng = pickupCoordinates.lng;

    const destinationLat =
      destinationCoordinates.lat;

    const destinationLng =
      destinationCoordinates.lng;

    const sameLocation =
      Math.abs(pickupLat - destinationLat) <
        0.000001 &&
      Math.abs(pickupLng - destinationLng) <
        0.000001;

    if (sameLocation) {
      setError(
        "Pickup and delivery destination cannot be the same."
      );
      return;
    }

    setRouteLoading(true);

    try {
      const route = await getRoadRoute(
        pickupLat,
        pickupLng,
        destinationLat,
        destinationLng
      );

      const actualDistanceKm =
        Number(route.distanceKm);

      const actualTimeMinutes =
        Number(route.timeMinutes);

      setDistanceKm(actualDistanceKm);
      setRouteTimeMinutes(actualTimeMinutes);
      setRouteGeometry(route.geometry);

      const calculatedDeliveryOptions =
        deliveryRides.map((delivery) => {
          const calculatedFare =
            delivery.baseFare +
            actualDistanceKm * delivery.perKm;

          const roundedFare =
            Math.ceil(calculatedFare);

          return {
            ...delivery,
            distanceKm: actualDistanceKm,
            routeTimeMinutes: actualTimeMinutes,
            fareAmount: roundedFare,
            fare: `₹${roundedFare}`,
          };
        });

      setDeliveryOptions(
        calculatedDeliveryOptions
      );

      setTimeout(() => {
        document
          .getElementById("delivery-options")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (routeError) {
      console.error(
        "ROAD ROUTE ERROR:",
        routeError
      );

      let message =
        routeError?.message ||
        "Unable to calculate the road route.";

      if (
        message
          .toLowerCase()
          .includes("no suitable edges")
      ) {
        message =
          "Geoapify could not find a road near one of the selected locations. Please choose another nearby location.";
      }

      setError(message);
      setDeliveryOptions([]);
    } finally {
      setRouteLoading(false);
    }
  };

  // =========================================================
  // PAYMENT
  // =========================================================

  const payForDelivery = async () => {
    setError("");

    if (paymentProcessing) return;

    if (!auth.currentUser) {
      setError(
        "Please login before making a payment."
      );
      return;
    }

    if (!selectedDelivery) {
      setError(
        "Please select a delivery option first."
      );
      return;
    }

    // Safety check:
    // If for some reason an OTP does not exist yet,
    // generate one before payment is completed.
    if (!deliveryOtp) {
      setDeliveryOtp(generateDeliveryOtp());
    }

    setPaymentProcessing(true);

    try {
      if (paymentMethod === "wallet") {
        const userRef = doc(
          db,
          "users",
          auth.currentUser.uid
        );

        await runTransaction(
          db,
          async (transaction) => {
            const userSnapshot =
              await transaction.get(userRef);

            if (!userSnapshot.exists()) {
              throw new Error(
                "Wallet account not found."
              );
            }

            const userData =
              userSnapshot.data();

            const currentBalance =
              typeof userData.wallet === "number"
                ? userData.wallet
                : Number(userData.wallet) || 0;

            if (
              currentBalance <
              selectedDelivery.fareAmount
            ) {
              throw new Error(
                `Insufficient RYDO Wallet balance. Your balance is ₹${currentBalance}, but this delivery costs ₹${selectedDelivery.fareAmount}.`
              );
            }

            const newBalance =
              currentBalance -
              selectedDelivery.fareAmount;

            const transactionData = {
              type: "Debit",
              amount:
                selectedDelivery.fareAmount,
              description:
                `Payment for ${selectedDelivery.name}`,
              deliveryType:
                selectedDelivery.name,
              distanceKm:
                selectedDelivery.distanceKm,
              createdAt: new Date(),
            };

            transaction.update(userRef, {
              wallet: newBalance,
              transactions: arrayUnion(
                transactionData
              ),
            });
          }
        );
      }

      setPaymentComplete(true);
      setError("");
    } catch (paymentError) {
      console.error(
        "PARCEL PAYMENT ERROR:",
        paymentError
      );

      setPaymentComplete(false);

      setError(
        paymentError?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  // =========================================================
  // CHAT
  // =========================================================

  const chatWithDriver = () => {
    if (!selectedDelivery) {
      setError(
        "Please select a delivery option first."
      );
      return;
    }

    const phone =
      selectedDelivery.driverPhone;

    const message = encodeURIComponent(
      `Hello ${selectedDelivery.driver}, I am contacting you regarding my RYDO parcel delivery.`
    );

    window.open(
      `https://wa.me/91${phone}?text=${message}`,
      "_blank"
    );
  };

  // =========================================================
  // CALL
  // =========================================================

  const callDriver = () => {
    if (!selectedDelivery) {
      setError(
        "Please select a delivery option first."
      );
      return;
    }

    window.location.href =
      `tel:+91${selectedDelivery.driverPhone}`;
  };

  // =========================================================
  // CONFIRM DELIVERY
  // =========================================================

  const confirmDelivery = async () => {
    setError("");

    if (isConfirming) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "Please login before confirming parcel delivery."
      );
      return;
    }

    if (!selectedDelivery) {
      setError(
        "Please select a delivery option first."
      );
      return;
    }

    if (!paymentComplete) {
      setError(
        "Please complete payment before confirming the delivery."
      );
      return;
    }

    if (!pickup || !destination) {
      setError(
        "Pickup and destination are required."
      );
      return;
    }

    setIsConfirming(true);

    try {
      const pickupCoordinates =
        getCoordinates(pickup);

      const destinationCoordinates =
        getCoordinates(destination);

      validateCoordinates(
        pickupCoordinates,
        "Pickup"
      );

      validateCoordinates(
        destinationCoordinates,
        "Destination"
      );

      const pickupLat = pickupCoordinates.lat;
      const pickupLng = pickupCoordinates.lng;

      const destinationLat =
        destinationCoordinates.lat;

      const destinationLng =
        destinationCoordinates.lng;

      const finalDistanceKm = Number(
        selectedDelivery.distanceKm
      );

      const finalRouteTimeMinutes = Number(
        selectedDelivery.routeTimeMinutes
      );

      const finalFare = Number(
        selectedDelivery.fareAmount
      );

      if (
        !Number.isFinite(finalDistanceKm) ||
        finalDistanceKm <= 0
      ) {
        throw new Error(
          "Road distance is missing. Please calculate the delivery route again."
        );
      }

      if (
        !Number.isFinite(
          finalRouteTimeMinutes
        ) ||
        finalRouteTimeMinutes <= 0
      ) {
        throw new Error(
          "Route time is missing. Please calculate the delivery route again."
        );
      }

      if (
        !Number.isFinite(finalFare) ||
        finalFare <= 0
      ) {
        throw new Error(
          "Delivery fare is invalid."
        );
      }

      // =====================================================
      // OTP SAFETY
      // =====================================================

      // Normally the OTP was already generated when the
      // customer selected the delivery vehicle.
      // This is a final safety fallback.
      const finalDeliveryOtp =
        deliveryOtp || generateDeliveryOtp();

      // Keep the UI state synchronized as well.
      setDeliveryOtp(finalDeliveryOtp);

      // =====================================================
      // PARCEL ID
      // =====================================================

      const parcelId =
        "RYDO-PCL-" +
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

      const now = new Date();

      const deliveryDate =
        now.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );

      const deliveryTime =
        now.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

      // =====================================================
      // PICKUP DATA
      // =====================================================

      const pickupData = {
        address:
          getLocationAddress(pickup),

        name:
          pickup?.name ||
          pickup?.properties?.name ||
          "",

        lat: pickupLat,

        lng: pickupLng,

        placeId:
          pickup?.placeId ||
          pickup?.place_id ||
          pickup?.properties?.place_id ||
          "",
      };

      // =====================================================
      // DESTINATION DATA
      // =====================================================

      const destinationData = {
        address:
          getLocationAddress(destination),

        name:
          destination?.name ||
          destination?.properties?.name ||
          "",

        lat: destinationLat,

        lng: destinationLng,

        placeId:
          destination?.placeId ||
          destination?.place_id ||
          destination?.properties?.place_id ||
          "",
      };

      // =====================================================
      // PAYMENT STATUS
      // =====================================================

      const paymentStatus =
        paymentMethod === "cash"
          ? "Cash Payment"
          : "Paid";

      const createdTimestamp =
        new Date().toISOString();

      // =====================================================
      // PARCEL DATA
      // =====================================================

      const parcelData = {
        // ===================================================
        // USER
        // ===================================================

        userId: currentUser.uid,

        // ===================================================
        // PARCEL ID
        // ===================================================

        parcelId,

        // ===================================================
        // DELIVERY OTP
        // ===================================================

        // Main OTP field
        deliveryOtp: finalDeliveryOtp,

        // Short alias for easy access from driver/status page
        otp: finalDeliveryOtp,

        // OTP status
        otpVerified: false,

        // ===================================================
        // DRIVER
        // ===================================================

        driverId:
          selectedDelivery.driverId,

        driver:
          selectedDelivery.driver,

        driverPhone:
          selectedDelivery.driverPhone,

        vehicle:
          selectedDelivery.vehicle,

        // ===================================================
        // DELIVERY TYPE
        // ===================================================

        deliveryOptionId:
          selectedDelivery.id,

        deliveryType:
          selectedDelivery.name,

        // ===================================================
        // PICKUP
        // ===================================================

        pickup: pickupData,

        destination: destinationData,

        pickupAddress:
          pickupData.address,

        destinationAddress:
          destinationData.address,

        pickupLat,

        pickupLng,

        destinationLat,

        destinationLng,

        // ===================================================
        // ROUTE
        // ===================================================

        distanceKm:
          finalDistanceKm,

        routeTimeMinutes:
          finalRouteTimeMinutes,

        routeGeometry:
          routeGeometry
            ? JSON.stringify(routeGeometry)
            : null,

        // ===================================================
        // SENDER
        // ===================================================

        senderName:
          senderName.trim(),

        senderPhone,

        // ===================================================
        // RECEIVER
        // ===================================================

        receiverName:
          receiverName.trim(),

        receiverPhone,

        // ===================================================
        // PARCEL
        // ===================================================

        parcelDetails:
          parcelDetails.trim(),

        // ===================================================
        // DRIVER ARRIVAL
        // ===================================================

        driverArrival:
          selectedDelivery.arrival,

        arrival:
          selectedDelivery.arrival,

        // ===================================================
        // FARE
        // ===================================================

        fare:
          selectedDelivery.fare,

        fareAmount:
          finalFare,

        baseFare:
          selectedDelivery.baseFare,

        perKm:
          selectedDelivery.perKm,

        // ===================================================
        // PAYMENT
        // ===================================================

        paymentStatus,

        paymentMethod,

        paidAmount:
          finalFare,

        paymentComplete: true,

        // ===================================================
        // DELIVERY STATUS
        // ===================================================

        status:
          "Driver Assigned",

        statusStep: 1,

        gpsStatus: "Waiting",

        driverOnline: false,

        // ===================================================
        // STATUS HISTORY
        // ===================================================

        statusHistory: [
          {
            status: "Order Placed",

            message:
              "Your parcel delivery request has been placed.",

            timestamp:
              createdTimestamp,
          },

          {
            status: "Driver Assigned",

            message:
              `${selectedDelivery.driver} has been assigned to your parcel.`,

            timestamp:
              createdTimestamp,
          },
        ],

        // ===================================================
        // DATE / TIME
        // ===================================================

        deliveryDate,

        deliveryTime,

        // ===================================================
        // FIRESTORE TIMESTAMPS
        // ===================================================

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      // =====================================================
      // CREATE FIRESTORE DOCUMENT
      // =====================================================

      const parcelCollection =
        collection(
          db,
          "parcelDeliveries"
        );

      const docRef = await addDoc(
        parcelCollection,
        parcelData
      );

      // =====================================================
      // CONFIRMATION ALERT
      // =====================================================

      alert(
        `Parcel delivery confirmed! 📦\n\n` +
          `Parcel ID: ${parcelId}\n` +
          `Driver: ${selectedDelivery.driver}\n` +
          `Vehicle: ${selectedDelivery.vehicle}\n` +
          `Distance: ${finalDistanceKm} km\n` +
          `Estimated Time: ${finalRouteTimeMinutes} min\n` +
          `Fare: ₹${finalFare}\n` +
          `Payment: ${
            paymentMethod === "wallet"
              ? "RYDO Wallet"
              : paymentMethod.toUpperCase()
          }\n\n` +
          `Status: Driver Assigned\n` +
          `Delivery OTP: ${finalDeliveryOtp}\n\n` +
          `Give this 4-digit OTP to the driver when your parcel is delivered.`
      );

      // =====================================================
      // NAVIGATE TO STATUS PAGE
      // =====================================================

      navigate(
        `/parcel-status/${docRef.id}`
      );
    } catch (err) {
      console.error(
        "PARCEL CONFIRM ERROR:",
        err
      );

      if (err?.code === "permission-denied") {
        setError(
          "Firebase permission denied. Check your Firestore rules."
        );
      } else if (
        err?.code === "failed-precondition"
      ) {
        setError(
          "Firestore is not ready. Please check your Firebase configuration."
        );
      } else if (err?.code === "unavailable") {
        setError(
          "Firebase is temporarily unavailable. Check your internet connection."
        );
      } else {
        setError(
          err?.message ||
            "Unable to confirm parcel delivery."
        );
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // =========================================================
  // PAYMENT LABEL
  // =========================================================

  const paymentLabel =
    paymentMethod === "wallet"
      ? "RYDO Wallet"
      : paymentMethod === "upi"
      ? "UPI"
      : paymentMethod === "card"
      ? "Card"
      : "Cash";

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#05070D] text-white overflow-x-hidden">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-48 -left-40 w-[520px] h-[520px] rounded-full bg-[#FFBE0B]/10 blur-[120px]" />

        <div className="absolute top-[35%] -right-48 w-[520px] h-[520px] rounded-full bg-yellow-500/[0.06] blur-[120px]" />

        <div className="absolute bottom-0 left-[35%] w-[450px] h-[450px] rounded-full bg-orange-500/[0.05] blur-[120px]" />

      </div>

      {/* =====================================================
          PAGE
      ===================================================== */}

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* ===================================================
            TOP NAV / MINI HEADER
        =================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10">

          <button
            type="button"
            onClick={() => navigate("/")}
            className="group flex items-center gap-3 w-fit"
          >

            <div className="w-11 h-11 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center font-black text-xl shadow-[0_0_30px_rgba(255,190,11,0.15)] group-hover:scale-105 transition">
              R
            </div>

            <div className="text-left">
              <p className="font-black tracking-tight text-lg">
                RYDO
              </p>

              <p className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-bold">
                Express
              </p>
            </div>

          </button>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">

              <div className="w-9 h-9 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center">
                💳
              </div>

              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Wallet
                </p>

                <p className="font-black text-sm">
                  ₹{walletBalance.toFixed(2)}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/[0.07] hover:text-white transition"
            >
              ← Home
            </button>

          </div>

        </div>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="grid xl:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch">

          {/* HERO LEFT */}

          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.015] p-7 sm:p-10 lg:p-12 overflow-hidden">

            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#FFBE0B]/10 blur-3xl" />

            <div className="relative">

              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFBE0B]/20 bg-[#FFBE0B]/10 px-4 py-2">

                <span className="w-2 h-2 rounded-full bg-[#FFBE0B] animate-pulse" />

                <span className="text-[#FFBE0B] text-[10px] sm:text-xs font-black uppercase tracking-[0.22em]">
                  RYDO Express Delivery
                </span>

              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.05em] leading-[0.9] mt-7">

                Move your
                <br />

                <span className="text-[#FFBE0B]">
                  parcel.
                </span>

              </h1>

              <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mt-7">
                Send documents, gifts, clothes and
                everyday parcels across the city with
                fast pickup, live tracking and trusted
                RYDO drivers.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg">

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xl">
                    ⚡
                  </div>

                  <p className="text-xs font-black mt-2">
                    Fast
                  </p>

                  <p className="text-[10px] text-gray-500 mt-1">
                    Quick pickup
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xl">
                    📍
                  </div>

                  <p className="text-xs font-black mt-2">
                    Tracked
                  </p>

                  <p className="text-[10px] text-gray-500 mt-1">
                    GPS enabled
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xl">
                    🔒
                  </div>

                  <p className="text-xs font-black mt-2">
                    Secure
                  </p>

                  <p className="text-[10px] text-gray-500 mt-1">
                    Driver verified
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* HERO RIGHT - DELIVERY VISUAL */}

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">
                  Delivery flow
                </p>

                <h2 className="text-xl font-black mt-1">
                  From pickup to doorstep
                </h2>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(255,190,11,0.12)]">
                📦
              </div>

            </div>

            <div className="mt-8">

              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div className="w-12 h-12 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 flex items-center justify-center">
                    📍
                  </div>

                  <div className="h-14 border-l border-dashed border-[#FFBE0B]/30 my-1" />

                </div>

                <div className="pt-1">

                  <p className="text-[10px] text-emerald-400 font-black tracking-[0.18em]">
                    STEP 01
                  </p>

                  <p className="font-black mt-1">
                    Choose pickup
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Tell us where the parcel is.
                  </p>

                </div>

              </div>

              <div className="flex gap-4">

                <div className="flex flex-col items-center">

                  <div className="w-12 h-12 rounded-2xl border border-[#FFBE0B]/20 bg-[#FFBE0B]/10 flex items-center justify-center">
                    🛵
                  </div>

                  <div className="h-14 border-l border-dashed border-[#FFBE0B]/30 my-1" />

                </div>

                <div className="pt-1">

                  <p className="text-[10px] text-[#FFBE0B] font-black tracking-[0.18em]">
                    STEP 02
                  </p>

                  <p className="font-black mt-1">
                    Pick a vehicle
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Choose Bike, Scooter or Car.
                  </p>

                </div>

              </div>

              <div className="flex gap-4">

                <div>

                  <div className="w-12 h-12 rounded-2xl border border-blue-400/20 bg-blue-400/10 flex items-center justify-center">
                    🏠
                  </div>

                </div>

                <div className="pt-1">

                  <p className="text-[10px] text-blue-400 font-black tracking-[0.18em]">
                    STEP 03
                  </p>

                  <p className="font-black mt-1">
                    Delivered
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Track your parcel until arrival.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            STEP 01
        =================================================== */}

        <section className="mt-14">

          <div className="flex items-end justify-between gap-4 mb-6">

            <div>

              <div className="flex items-center gap-3">

                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FFBE0B] text-black text-sm font-black">
                  01
                </span>

                <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                  Delivery details
                </p>

              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
                Where are we sending it?
              </h2>

              <p className="text-gray-500 mt-2">
                Enter the route and parcel information.
              </p>

            </div>

            {distanceKm > 0 && (
              <div className="hidden md:flex items-center gap-2 rounded-2xl border border-[#FFBE0B]/20 bg-[#FFBE0B]/5 px-4 py-3">

                <span className="text-lg">
                  📏
                </span>

                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                    Road distance
                  </p>

                  <p className="font-black text-[#FFBE0B]">
                    {distanceKm} km
                  </p>
                </div>

              </div>
            )}

          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">

            {/* LOCATION CARDS */}

            <div className="grid lg:grid-cols-2 gap-5">

              {/* PICKUP */}

              <div className="relative rounded-[1.75rem] border border-emerald-500/15 bg-emerald-500/[0.035] p-5">

                <div className="flex items-center gap-4 mb-5">

                  <div className="relative">

                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                      📍
                    </div>

                    <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-400 border-4 border-[#0a0d14]" />

                  </div>

                  <div>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      Pickup point
                    </p>

                    <h3 className="font-black mt-1">
                      Collect parcel from
                    </h3>
                  </div>

                </div>

                <LocationAutocomplete
                  label=""
                  placeholder="Search pickup location"
                  value={pickup}
                  onSelect={(location) => {
                    setPickup(location);
                    setError("");
                    resetDeliveryOptions();
                  }}
                />

                {pickup && (
                  <div className="mt-4 rounded-xl bg-black/20 border border-white/5 px-4 py-3">

                    <p className="text-[9px] text-emerald-400 uppercase tracking-widest font-black">
                      Selected
                    </p>

                    <p className="text-sm font-bold mt-1 truncate">
                      {getLocationAddress(pickup)}
                    </p>

                  </div>
                )}

              </div>

              {/* DESTINATION */}

              <div className="relative rounded-[1.75rem] border border-blue-500/15 bg-blue-500/[0.035] p-5">

                <div className="flex items-center gap-4 mb-5">

                  <div className="relative">

                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                      🏠
                    </div>

                    <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-blue-400 border-4 border-[#0a0d14]" />

                  </div>

                  <div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      Destination
                    </p>

                    <h3 className="font-black mt-1">
                      Deliver parcel to
                    </h3>
                  </div>

                </div>

                <LocationAutocomplete
                  label=""
                  placeholder="Search delivery destination"
                  value={destination}
                  onSelect={(location) => {
                    setDestination(location);
                    setError("");
                    resetDeliveryOptions();
                  }}
                />

                {destination && (
                  <div className="mt-4 rounded-xl bg-black/20 border border-white/5 px-4 py-3">

                    <p className="text-[9px] text-blue-400 uppercase tracking-widest font-black">
                      Selected
                    </p>

                    <p className="text-sm font-bold mt-1 truncate">
                      {getLocationAddress(destination)}
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* ROUTE PREVIEW */}

            {(pickup || destination) && (
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">

                <div className="flex items-center gap-3 mb-4">

                  <span className="text-lg">
                    🧭
                  </span>

                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                    Delivery route
                  </p>

                </div>

                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">

                  <div>

                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">
                      From
                    </p>

                    <p className="font-bold mt-1 truncate">
                      {getLocationAddress(pickup) ||
                        "Select pickup"}
                    </p>

                  </div>

                  <div className="hidden md:flex w-11 h-11 rounded-full bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 text-[#FFBE0B] items-center justify-center">
                    →
                  </div>

                  <div>

                    <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">
                      To
                    </p>

                    <p className="font-bold mt-1 truncate">
                      {getLocationAddress(destination) ||
                        "Select destination"}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* PEOPLE */}

            <div className="grid lg:grid-cols-2 gap-5 mt-5">

              {/* SENDER */}

              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl">
                    📤
                  </div>

                  <div>
                    <p className="text-[10px] text-[#FFBE0B] font-black uppercase tracking-widest">
                      Sender
                    </p>

                    <p className="font-black mt-1">
                      Who is sending?
                    </p>
                  </div>

                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-5">

                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => {
                      setSenderName(e.target.value);
                      setError("");
                    }}
                    placeholder="Full name"
                    className="h-14 w-full bg-white/[0.035] border border-white/10 rounded-2xl px-4 text-sm font-semibold outline-none transition focus:border-[#FFBE0B]/60 focus:bg-[#FFBE0B]/[0.03]"
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={senderPhone}
                    onChange={(e) => {
                      setSenderPhone(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      );
                      setError("");
                    }}
                    placeholder="Mobile number"
                    className="h-14 w-full bg-white/[0.035] border border-white/10 rounded-2xl px-4 text-sm font-semibold outline-none transition focus:border-[#FFBE0B]/60 focus:bg-[#FFBE0B]/[0.03]"
                  />

                </div>

              </div>

              {/* RECEIVER */}

              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                    📥
                  </div>

                  <div>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                      Receiver
                    </p>

                    <p className="font-black mt-1">
                      Who receives it?
                    </p>
                  </div>

                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-5">

                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => {
                      setReceiverName(e.target.value);
                      setError("");
                    }}
                    placeholder="Full name"
                    className="h-14 w-full bg-white/[0.035] border border-white/10 rounded-2xl px-4 text-sm font-semibold outline-none transition focus:border-blue-400/60 focus:bg-blue-400/[0.03]"
                  />

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={receiverPhone}
                    onChange={(e) => {
                      setReceiverPhone(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      );
                      setError("");
                    }}
                    placeholder="Mobile number"
                    className="h-14 w-full bg-white/[0.035] border border-white/10 rounded-2xl px-4 text-sm font-semibold outline-none transition focus:border-blue-400/60 focus:bg-blue-400/[0.03]"
                  />

                </div>

              </div>

            </div>

            {/* PARCEL DETAILS */}

            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/20 p-5">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl">
                    📦
                  </div>

                  <div>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">
                      Parcel details
                    </p>

                    <p className="font-black mt-1">
                      What's inside?
                    </p>
                  </div>

                </div>

                <span className="hidden sm:block text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  Be specific
                </span>

              </div>

              <textarea
                value={parcelDetails}
                onChange={(e) => {
                  setParcelDetails(e.target.value);
                  setError("");
                }}
                placeholder="Example: Documents, clothes, electronics, gift..."
                rows={4}
                className="mt-5 w-full bg-white/[0.035] border border-white/10 rounded-2xl px-4 py-4 text-sm font-medium outline-none transition focus:border-[#FFBE0B]/60 focus:bg-[#FFBE0B]/[0.02] resize-none"
              />

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4">

                <div className="flex gap-3 items-start">

                  <div className="w-9 h-9 shrink-0 rounded-xl bg-red-500/10 flex items-center justify-center">
                    ⚠️
                  </div>

                  <div>
                    <p className="text-red-400 text-xs font-black uppercase tracking-widest">
                      Something needs attention
                    </p>

                    <p className="text-red-300/90 text-sm font-semibold mt-1">
                      {error}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* FIND BUTTON */}

            <button
              type="button"
              onClick={findDelivery}
              disabled={routeLoading}
              className="group relative mt-6 w-full overflow-hidden rounded-2xl bg-[#FFBE0B] text-black py-5 font-black text-base sm:text-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_50px_rgba(255,190,11,0.18)] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >

              <span className="relative flex items-center justify-center gap-3">

                {routeLoading ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />

                    Calculating best route...
                  </>
                ) : (
                  <>
                    Find Delivery Options

                    <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}

              </span>

            </button>

          </div>

        </section>

        {/* ===================================================
            ROUTE STATS
        =================================================== */}

        {deliveryOptions.length > 0 && (
          <section className="mt-14">

            <div className="grid sm:grid-cols-3 gap-4">

              <div className="rounded-[1.75rem] border border-[#FFBE0B]/15 bg-[#FFBE0B]/[0.04] p-5">

                <div className="flex items-center justify-between">

                  <div className="w-11 h-11 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl">
                    📏
                  </div>

                  <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                    Route
                  </span>

                </div>

                <p className="text-2xl font-black text-[#FFBE0B] mt-5">
                  {distanceKm} km
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Actual road distance
                </p>

              </div>

              <div className="rounded-[1.75rem] border border-blue-500/15 bg-blue-500/[0.04] p-5">

                <div className="flex items-center justify-between">

                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                    ⏱️
                  </div>

                  <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                    ETA
                  </span>

                </div>

                <p className="text-2xl font-black mt-5">
                  {routeTimeMinutes} min
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Estimated route time
                </p>

              </div>

              <div className="rounded-[1.75rem] border border-emerald-500/15 bg-emerald-500/[0.04] p-5">

                <div className="flex items-center justify-between">

                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">
                    🛡️
                  </div>

                  <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                    RYDO
                  </span>

                </div>

                <p className="text-2xl font-black mt-5">
                  Secure
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  GPS tracked delivery
                </p>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            STEP 02 - DELIVERY OPTIONS
        =================================================== */}

        {deliveryOptions.length > 0 && (
          <section
            id="delivery-options"
            className="mt-14 scroll-mt-24"
          >

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">

              <div>

                <div className="flex items-center gap-3">

                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FFBE0B] text-black text-sm font-black">
                    02
                  </span>

                  <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                    Choose delivery
                  </p>

                </div>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
                  Choose your ride
                </h2>

                <p className="text-gray-500 mt-2">
                  Select the delivery vehicle that fits your parcel.
                </p>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">

                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                  Starting from
                </p>

                <p className="text-xl font-black text-[#FFBE0B] mt-1">
                  ₹{Math.min(
                    ...deliveryOptions.map(
                      (item) => item.fareAmount
                    )
                  )}
                </p>

              </div>

            </div>

            {/* DELIVERY CARDS */}

            <div className="grid lg:grid-cols-3 gap-5">

              {deliveryOptions.map((delivery) => {

                const isSelected =
                  selectedDelivery?.id ===
                  delivery.id;

                return (
                  <button
                    key={delivery.id}
                    type="button"
                    onClick={() => {
                      setSelectedDelivery(
                        delivery
                      );

                      setPaymentComplete(false);

                      // =========================================
                      // GENERATE NEW 4-DIGIT OTP
                      // =========================================

                      setDeliveryOtp(
                        generateDeliveryOtp()
                      );

                      setError("");
                    }}
                    className={`group relative text-left rounded-[2rem] border p-6 transition-all duration-300 ${
                      isSelected
                        ? "border-[#FFBE0B] bg-[#FFBE0B]/[0.07] shadow-[0_20px_60px_rgba(255,190,11,0.08)] -translate-y-1"
                        : "border-white/10 bg-white/[0.035] hover:border-[#FFBE0B]/30 hover:-translate-y-1 hover:bg-white/[0.05]"
                    }`}
                  >

                    {/* SELECTED MARK */}

                    {isSelected && (
                      <div className="absolute right-5 top-5 w-8 h-8 rounded-full bg-[#FFBE0B] text-black flex items-center justify-center font-black">
                        ✓
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">

                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border ${
                        isSelected
                          ? "bg-[#FFBE0B]/10 border-[#FFBE0B]/30"
                          : "bg-black/20 border-white/10"
                      }`}>
                        {delivery.icon}
                      </div>

                      <span className={`text-[9px] font-black tracking-[0.15em] rounded-full px-3 py-1.5 ${
                        isSelected
                          ? "bg-[#FFBE0B] text-black"
                          : "bg-white/[0.07] text-gray-400"
                      }`}>
                        {isSelected
                          ? "SELECTED"
                          : delivery.badge}
                      </span>

                    </div>

                    <h3 className="text-2xl font-black mt-6">
                      {delivery.name}
                    </h3>

                    <p className="text-gray-500 text-sm leading-relaxed mt-2">
                      {delivery.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6">

                      <div className="rounded-xl bg-black/20 border border-white/5 p-3">

                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                          Pickup
                        </p>

                        <p className="font-black text-sm mt-1 text-[#FFBE0B]">
                          {delivery.arrival}
                        </p>

                      </div>

                      <div className="rounded-xl bg-black/20 border border-white/5 p-3">

                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                          Route
                        </p>

                        <p className="font-black text-sm mt-1">
                          {delivery.routeTimeMinutes} min
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 space-y-3">

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-gray-500">
                          Driver
                        </span>

                        <span className="font-bold">
                          {delivery.driver}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-gray-500">
                          Vehicle
                        </span>

                        <span className="font-bold">
                          {delivery.vehicle}
                        </span>

                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">

                        <span className="text-gray-500">
                          Distance
                        </span>

                        <span className="font-bold text-[#FFBE0B]">
                          {delivery.distanceKm} km
                        </span>

                      </div>

                    </div>

                    <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between">

                      <div>

                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                          Total fare
                        </p>

                        <p className="text-3xl font-black text-[#FFBE0B] mt-1">
                          {delivery.fare}
                        </p>

                        <p className="text-[10px] text-gray-600 mt-1">
                          ₹{delivery.baseFare} base + ₹
                          {delivery.perKm}/km
                        </p>

                      </div>

                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                        isSelected
                          ? "bg-[#FFBE0B] text-black"
                          : "bg-white/[0.05] text-gray-500 group-hover:bg-[#FFBE0B]/10 group-hover:text-[#FFBE0B]"
                      }`}>
                        →
                      </div>

                    </div>

                  </button>
                );
              })}

            </div>

            {/* =================================================
                PAYMENT PANEL
            ================================================= */}

            {selectedDelivery && (
              <div className="mt-7 rounded-[2.5rem] border border-[#FFBE0B]/20 bg-gradient-to-br from-[#FFBE0B]/[0.08] via-white/[0.025] to-transparent p-5 sm:p-8">

                {/* SELECTED HEADER */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center text-3xl shadow-[0_0_35px_rgba(255,190,11,0.12)]">
                      {selectedDelivery.icon}
                    </div>

                    <div>

                      <p className="text-[9px] text-[#FFBE0B] uppercase tracking-[0.2em] font-black">
                        Selected vehicle
                      </p>

                      <h3 className="text-2xl font-black mt-1">
                        {selectedDelivery.name}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        {selectedDelivery.driver}
                        {" • "}
                        {selectedDelivery.vehicle}
                      </p>

                    </div>

                  </div>

                  <div className="md:text-right">

                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                      Delivery total
                    </p>

                    <p className="text-4xl font-black text-[#FFBE0B] mt-1">
                      {selectedDelivery.fare}
                    </p>

                  </div>

                </div>

                {/* STEP 03 */}

                <div className="mt-9">

                  <div className="flex items-center gap-3">

                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FFBE0B] text-black text-sm font-black">
                      03
                    </span>

                    <div>

                      <p className="text-[#FFBE0B] text-[10px] font-black uppercase tracking-[0.2em]">
                        Secure payment
                      </p>

                      <h3 className="text-2xl font-black mt-1">
                        How would you like to pay?
                      </h3>

                    </div>

                  </div>

                  <p className="text-gray-500 text-sm mt-3">
                    Choose your preferred payment method.
                  </p>

                </div>

                {/* PAYMENT OPTIONS */}

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                  {[
                    {
                      id: "wallet",
                      icon: "💳",
                      title: "RYDO Wallet",
                      description: `₹${walletBalance.toFixed(
                        2
                      )} available`,
                    },
                    {
                      id: "upi",
                      icon: "📱",
                      title: "UPI",
                      description: "Pay instantly",
                    },
                    {
                      id: "card",
                      icon: "💳",
                      title: "Card",
                      description: "Credit or debit",
                    },
                    {
                      id: "cash",
                      icon: "💵",
                      title: "Cash",
                      description: "Pay driver directly",
                    },
                  ].map((method) => {

                    const active =
                      paymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method.id);
                          setPaymentComplete(false);
                          setError("");
                        }}
                        className={`relative text-left rounded-2xl border p-5 transition-all duration-300 ${
                          active
                            ? "border-[#FFBE0B] bg-[#FFBE0B]/10 -translate-y-0.5"
                            : "border-white/10 bg-black/20 hover:border-white/25"
                        }`}
                      >

                        {active && (
                          <span className="absolute right-3 top-3 w-6 h-6 rounded-full bg-[#FFBE0B] text-black flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                        )}

                        <div className="text-2xl">
                          {method.icon}
                        </div>

                        <p className="font-black mt-4">
                          {method.title}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {method.description}
                        </p>

                      </button>
                    );
                  })}

                </div>

                {/* PAYMENT SUMMARY */}

                <div className="grid lg:grid-cols-[1fr_0.8fr] gap-5 mt-6">

                  <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">

                    <div className="flex items-center gap-3 mb-5">

                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                        🧾
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                          Order summary
                        </p>

                        <p className="font-black mt-1">
                          Parcel delivery
                        </p>
                      </div>

                    </div>

                    <div className="space-y-4">

                      <div className="flex justify-between gap-4">

                        <span className="text-gray-500 text-sm">
                          Vehicle
                        </span>

                        <span className="font-bold text-sm text-right">
                          {selectedDelivery.name}
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span className="text-gray-500 text-sm">
                          Distance
                        </span>

                        <span className="font-bold text-sm">
                          {selectedDelivery.distanceKm} km
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span className="text-gray-500 text-sm">
                          Estimated time
                        </span>

                        <span className="font-bold text-sm">
                          {selectedDelivery.routeTimeMinutes} min
                        </span>

                      </div>

                      <div className="flex justify-between gap-4">

                        <span className="text-gray-500 text-sm">
                          Payment
                        </span>

                        <span className="font-bold text-sm">
                          {paymentLabel}
                        </span>

                      </div>

                    </div>

                    <div className="mt-5 pt-5 border-t border-white/10 flex justify-between items-end">

                      <span className="font-black">
                        Total
                      </span>

                      <span className="text-2xl font-black text-[#FFBE0B]">
                        ₹{selectedDelivery.fareAmount}
                      </span>

                    </div>

                  </div>

                  {/* WALLET CARD */}

                  <div className="rounded-[1.75rem] border border-[#FFBE0B]/15 bg-[#FFBE0B]/[0.04] p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                          RYDO Wallet
                        </p>

                        <p className="text-3xl font-black mt-2">
                          ₹{walletBalance.toFixed(2)}
                        </p>

                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center text-xl">
                        💳
                      </div>

                    </div>

                    <div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden">

                      <div
                        className="h-full rounded-full bg-[#FFBE0B] transition-all"
                        style={{
                          width:
                            selectedDelivery
                              ? `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    (walletBalance /
                                      selectedDelivery.fareAmount) *
                                      100
                                  )
                                )}%`
                              : "0%",
                        }}
                      />

                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      {walletBalance >=
                      selectedDelivery.fareAmount
                        ? "Your wallet has enough balance for this delivery."
                        : "Add money to your wallet to use wallet payment."}
                    </p>

                  </div>

                </div>

                {/* INSUFFICIENT BALANCE */}

                {paymentMethod === "wallet" &&
                  walletBalance <
                    selectedDelivery.fareAmount && (
                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-5">

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                          ⚠️
                        </div>

                        <div>

                          <p className="text-red-400 font-black">
                            Insufficient wallet balance
                          </p>

                          <p className="text-red-300/70 text-sm mt-1">
                            Balance ₹
                            {walletBalance.toFixed(2)}
                            {" • "}
                            Required ₹
                            {selectedDelivery.fareAmount}
                          </p>

                        </div>

                      </div>

                    </div>
                  )}

                {/* PAYMENT SUCCESS */}

                {paymentComplete && (
                  <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">

                    <div className="flex items-center gap-4">

                      <div className="w-11 h-11 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xl font-black">
                        ✓
                      </div>

                      <div>

                        <p className="text-emerald-400 font-black">
                          Payment successful
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          ₹
                          {selectedDelivery.fareAmount}
                          {" paid using "}
                          {paymentLabel}
                        </p>

                      </div>

                    </div>

                  </div>
                )}

                {/* PAY */}

                {!paymentComplete && (
                  <button
                    type="button"
                    onClick={payForDelivery}
                    disabled={
                      paymentProcessing ||
                      (paymentMethod === "wallet" &&
                        walletBalance <
                          selectedDelivery.fareAmount)
                    }
                    className="group w-full mt-6 py-5 rounded-2xl bg-[#FFBE0B] text-black font-black text-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(255,190,11,0.18)] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >

                    <span className="flex items-center justify-center gap-3">

                      {paymentProcessing ? (
                        <>
                          <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                          Processing payment...
                        </>
                      ) : paymentMethod === "wallet" &&
                        walletBalance <
                          selectedDelivery.fareAmount ? (
                        "Insufficient Wallet Balance"
                      ) : (
                        <>
                          Pay ₹
                          {selectedDelivery.fareAmount}

                          <span className="text-xl transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </>
                      )}

                    </span>

                  </button>
                )}

                {/* DRIVER */}

                {paymentComplete && (
                  <div className="mt-7 rounded-[1.75rem] border border-white/10 bg-black/25 p-5">

                    <div className="flex items-center gap-4">

                      <div className="relative">

                        <div className="w-14 h-14 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-2xl">
                          👨‍✈️
                        </div>

                        <span className="absolute right-0 bottom-0 w-4 h-4 rounded-full bg-emerald-400 border-4 border-[#090c12]" />

                      </div>

                      <div className="flex-1">

                        <p className="text-[9px] text-[#FFBE0B] uppercase tracking-widest font-black">
                          Assigned driver
                        </p>

                        <h4 className="text-xl font-black mt-1">
                          {selectedDelivery.driver}
                        </h4>

                        <p className="text-sm text-gray-500 mt-1">
                          {selectedDelivery.vehicle}
                          {" • "}
                          Pickup in{" "}
                          {selectedDelivery.arrival}
                        </p>

                      </div>

                      <div className="hidden sm:block text-right">

                        <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">
                          Status
                        </p>

                        <p className="text-emerald-400 text-sm font-black mt-1">
                          Assigned
                        </p>

                      </div>

                    </div>

                    {/* =================================================
                        DELIVERY OTP
                    ================================================= */}

                    <div className="mt-5 rounded-[1.75rem] border border-[#FFBE0B]/30 bg-[#FFBE0B]/[0.08] p-5">

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

                        <div>

                          <p className="text-[9px] text-[#FFBE0B] uppercase tracking-[0.2em] font-black">
                            Delivery OTP
                          </p>

                          <h4 className="text-xl font-black mt-1">
                            Give this code to the driver
                          </h4>

                          <p className="text-sm text-gray-500 mt-1">
                            The driver should enter this 4-digit
                            code when handing over your parcel.
                          </p>

                        </div>

                        <div className="flex items-center gap-2">

                          {deliveryOtp
                            .split("")
                            .map((digit, index) => (
                              <div
                                key={index}
                                className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border border-[#FFBE0B]/30 bg-black/30 flex items-center justify-center text-2xl sm:text-3xl font-black text-[#FFBE0B]"
                              >
                                {digit}
                              </div>
                            ))}

                        </div>

                      </div>

                      <div className="mt-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3">

                        <p className="text-xs text-gray-400">
                          🔐 Keep this OTP private until the parcel
                          is delivered.
                        </p>

                      </div>

                    </div>

                    {/* DRIVER CONTACT BUTTONS */}

                    <div className="grid sm:grid-cols-2 gap-3 mt-5">

                      <button
                        type="button"
                        onClick={chatWithDriver}
                        className="py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400 font-black hover:bg-emerald-500/[0.12] transition"
                      >
                        <span className="flex items-center justify-center gap-2">
                          💬
                          Chat with Driver
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={callDriver}
                        className="py-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] text-blue-400 font-black hover:bg-blue-500/[0.12] transition"
                      >
                        <span className="flex items-center justify-center gap-2">
                          📞
                          Call Driver
                        </span>
                      </button>

                    </div>

                  </div>
                )}

                {/* CONFIRM */}

                <button
                  type="button"
                  onClick={confirmDelivery}
                  disabled={
                    isConfirming ||
                    !paymentComplete
                  }
                  className={`group w-full mt-5 py-5 rounded-2xl font-black text-lg transition-all duration-300 ${
                    isConfirming ||
                    !paymentComplete
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-[#FFBE0B] text-black hover:-translate-y-0.5 hover:shadow-[0_15px_50px_rgba(255,190,11,0.2)]"
                  }`}
                >

                  {isConfirming ? (
                    <span className="flex items-center justify-center gap-3">

                      <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />

                      Confirming delivery...

                    </span>
                  ) : !paymentComplete ? (
                    "Complete Payment First"
                  ) : (
                    <span className="flex items-center justify-center gap-3">

                      Confirm Parcel Delivery

                      <span className="text-xl transition-transform group-hover:translate-x-1">
                        →
                      </span>

                    </span>
                  )}

                </button>

                <p className="text-center text-[10px] text-gray-600 mt-4">
                  🔒 Your delivery details are securely stored
                  in RYDO.
                </p>

              </div>
            )}

          </section>
        )}

        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {deliveryOptions.length === 0 && !routeLoading && (
          <section className="mt-14">

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 sm:p-9">

              <div className="flex flex-col md:flex-row md:items-center gap-6">

                <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/15 flex items-center justify-center text-3xl">
                  📦
                </div>

                <div>

                  <p className="text-[#FFBE0B] text-[10px] font-black uppercase tracking-[0.2em]">
                    Ready when you are
                  </p>

                  <h3 className="text-2xl font-black mt-1">
                    Start your parcel delivery
                  </h3>

                  <p className="text-gray-500 text-sm mt-2 max-w-2xl">
                    Select your pickup and destination,
                    enter the sender and receiver details,
                    then we'll calculate the best delivery
                    options for you.
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* ===================================================
            BOTTOM ACTIONS
        =================================================== */}

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">

          <div className="flex flex-col sm:flex-row gap-3">

            <button
              type="button"
              onClick={() => navigate("/")}
              className="group flex-1 py-4 rounded-2xl border border-[#FFBE0B]/25 bg-[#FFBE0B]/[0.06] text-[#FFBE0B] font-black hover:bg-[#FFBE0B] hover:text-black transition-all"
            >

              <span className="flex items-center justify-center gap-3">

                <span className="text-xl transition-transform group-hover:-translate-x-1">
                  ←
                </span>

                Back to Home

              </span>

            </button>

            <button
              type="button"
              onClick={resetEverything}
              className="group flex-1 py-4 rounded-2xl border border-white/10 bg-white/[0.035] text-white font-black hover:bg-white/[0.07] hover:border-[#FFBE0B]/30 transition-all"
            >

              <span className="flex items-center justify-center gap-3">

                <span className="text-xl">
                  📦
                </span>

                Start New Delivery

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>

              </span>

            </button>

          </div>

        </section>

        {/* ===================================================
            FOOTER TRUST
        =================================================== */}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] text-gray-600 uppercase tracking-[0.16em] font-black">

          <span>🔒 Secure Payment</span>

          <span>•</span>

          <span>📍 GPS Tracking</span>

          <span>•</span>

          <span>🚚 Verified Drivers</span>

          <span>•</span>

          <span>⚡ Fast Delivery</span>

        </div>

      </main>

    </div>
  );
}

export default ParcelDelivery;
