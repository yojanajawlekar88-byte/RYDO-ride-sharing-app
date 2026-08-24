import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Map from "../components/Map";
import LocationAutocomplete from "../components/LocationAutocomplete";

import { auth, db } from "../firebase";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

/* ============================================================
   RIDE OTP
   ============================================================ */

/*
  A NEW 4-DIGIT OTP is generated for every ride.

  Example:
  Ride 1 -> 5832
  Ride 2 -> 7419
  Ride 3 -> 2065

  It is NOT fixed to 123456.
*/
const generateRideOtp = () => {
  return Math.floor(
    1000 + Math.random() * 9000
  ).toString();
};

/* ============================================================
   RIDE OPTIONS
============================================================ */

const rides = [
  {
    id: "mini",
    name: "Mini",
    icon: "🚗",
    description: "Affordable everyday rides",
    baseFare: 50,
    perKm: 12,
    arrival: 3,
  },
  {
    id: "sedan",
    name: "Sedan",
    icon: "🚘",
    description: "Comfortable premium ride",
    baseFare: 70,
    perKm: 16,
    arrival: 5,
  },
  {
    id: "suv",
    name: "SUV",
    icon: "🚙",
    description: "Extra space for a comfortable journey",
    baseFare: 100,
    perKm: 22,
    arrival: 8,
  },
  {
    id: "bike",
    name: "Bike",
    icon: "🛵",
    description: "Fast rides through traffic",
    baseFare: 30,
    perKm: 8,
    arrival: 2,
  },
];

/* ============================================================
   DRIVER DATA
============================================================ */

const driverData = {
  Mini: {
    driver: "Rahul Sharma",
    vehicle: "MH12 AB 1234",
    rating: "4.8",
    vehicleType: "Maruti Suzuki WagonR",
    vehicleColor: "White",
    experience: "5 Years",
    totalRides: "2,450+",
    phone: "+919876543210",
    verified: true,
  },

  Sedan: {
    driver: "Amit Patil",
    vehicle: "MH14 CD 5678",
    rating: "4.9",
    vehicleType: "Honda City",
    vehicleColor: "Silver",
    experience: "7 Years",
    totalRides: "3,820+",
    phone: "+919876543211",
    verified: true,
  },

  SUV: {
    driver: "Priya Singh",
    vehicle: "MH16 EF 9012",
    rating: "4.8",
    vehicleType: "Hyundai Creta",
    vehicleColor: "Black",
    experience: "6 Years",
    totalRides: "3,120+",
    phone: "+919876543212",
    verified: true,
  },

  Bike: {
    driver: "Vikas More",
    vehicle: "MH12 GH 3456",
    rating: "4.7",
    vehicleType: "Honda Activa",
    vehicleColor: "Red",
    experience: "4 Years",
    totalRides: "1,980+",
    phone: "+919876543213",
    verified: true,
  },
};

/* ============================================================
   COORDINATES
============================================================ */

const getCoordinates = (location) => {
  if (!location) return null;

  const lat = Number(
    location.lat ??
      location.latitude ??
      location.position?.lat ??
      location.coordinates?.lat ??
      location.coords?.lat
  );

  const lng = Number(
    location.lng ??
      location.lon ??
      location.longitude ??
      location.position?.lng ??
      location.coordinates?.lng ??
      location.coords?.lng
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

/* ============================================================
   DISTANCE CALCULATOR
============================================================ */

const calculateDistanceKm = (point1, point2) => {
  const first = getCoordinates(point1);
  const second = getCoordinates(point2);

  if (!first || !second) return 0;

  const earthRadiusKm = 6371;

  const dLat =
    ((second.lat - first.lat) * Math.PI) / 180;

  const dLng =
    ((second.lng - first.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((first.lat * Math.PI) / 180) *
      Math.cos((second.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};

/* ============================================================
   DRIVER START LOCATION
============================================================ */

const createDriverStartPoint = (
  pickup,
  destination,
  distanceKm = 1.5
) => {
  const p = getCoordinates(pickup);
  const d = getCoordinates(destination);

  if (!p || !d) return null;

  const earthRadiusKm = 6371;

  const bearing = Math.atan2(
    Math.sin(
      ((p.lng - d.lng) * Math.PI) / 180
    ) *
      Math.cos((p.lat * Math.PI) / 180),

    Math.cos((d.lat * Math.PI) / 180) *
        Math.sin((p.lat * Math.PI) / 180) -
      Math.sin((d.lat * Math.PI) / 180) *
        Math.cos((p.lat * Math.PI) / 180) *
        Math.cos(
          ((p.lng - d.lng) * Math.PI) / 180
        )
  );

  const angularDistance =
    distanceKm / earthRadiusKm;

  const lat1 =
    (p.lat * Math.PI) / 180;

  const lng1 =
    (p.lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) *
        Math.cos(angularDistance) +
      Math.cos(lat1) *
        Math.sin(angularDistance) *
        Math.cos(bearing)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(angularDistance) *
        Math.cos(lat1),

      Math.cos(angularDistance) -
        Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,

    lng:
      (((lng2 * 180) / Math.PI + 540) %
        360) -
      180,
  };
};

/* ============================================================
   LOCATION NAMES
============================================================ */

const getLocationName = (location) => {
  if (!location) return "";

  return (
    location.name ||
    location.address ||
    location.displayName ||
    location.formatted ||
    ""
  );
};

const getShortLocationName = (location) => {
  if (!location) return "";

  return (
    location.shortName ||
    location.name ||
    location.address ||
    location.displayName ||
    location.formatted ||
    ""
  );
};

/* ============================================================
   BOOK RIDE
============================================================ */

function BookRide() {
  const navigate = useNavigate();

  const confirmationRef = useRef(null);

  /* ==========================================================
     AUTH
  ========================================================== */

  const [currentUser, setCurrentUser] = useState(
    auth.currentUser
  );

  /* ==========================================================
     LOCATIONS
  ========================================================== */

  const [pickup, setPickup] = useState(null);

  const [destination, setDestination] =
    useState(null);

  const [distanceKm, setDistanceKm] =
    useState(0);

  /* ==========================================================
     RIDES
  ========================================================== */

  const [showRides, setShowRides] =
    useState(false);

  const [selectedRide, setSelectedRide] =
    useState(null);

  /* ==========================================================
     WALLET
  ========================================================== */

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState("wallet");

  /* ==========================================================
     BOOKING
  ========================================================== */

  const [bookingConfirmed, setBookingConfirmed] =
    useState(false);

  const [bookingProcessing, setBookingProcessing] =
    useState(false);

  const [bookingId, setBookingId] =
    useState("");

  const [rideDocId, setRideDocId] =
    useState("");

  /* ==========================================================
     RIDE OTP
  ========================================================== */

  const [rideOtp, setRideOtp] =
    useState("");

  const [otpInput, setOtpInput] =
    useState("");

  const [showOtpModal, setShowOtpModal] =
    useState(false);

  const [otpError, setOtpError] =
    useState("");

  const [otpVerifying, setOtpVerifying] =
    useState(false);

  /* ==========================================================
     JOURNEY
  ========================================================== */

  const [driverLocation, setDriverLocation] =
    useState(null);

  const [driverStartLocation, setDriverStartLocation] =
    useState(null);

  const [journeyStage, setJourneyStage] =
    useState(0);

  const [journeyProgress, setJourneyProgress] =
    useState(0);

  const journeyStartRef = useRef(null);

  const journeyFrameRef = useRef(null);

  const lastJourneyStageRef = useRef(0);

  /* ==========================================================
     ERROR
  ========================================================== */

  const [error, setError] =
    useState("");

  /* ==========================================================
     CHAT
  ========================================================== */

  const [chatOpen, setChatOpen] =
    useState(false);

  const [chatMessage, setChatMessage] =
    useState("");

  const [chatMessages, setChatMessages] =
    useState([
      {
        id: 1,
        sender: "driver",
        text:
          "Hello! I'm your RYDO driver. I'm on my way.",
      },
    ]);

  /* ==========================================================
     AUTH LISTENER
  ========================================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
        }
      );

    return () => unsubscribe();
  }, []);

  /* ==========================================================
     WALLET LISTENER
  ========================================================== */

  useEffect(() => {
    if (!currentUser) {
      setWalletBalance(0);
      return undefined;
    }

    const userRef = doc(
      db,
      "users",
      currentUser.uid
    );

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setWalletBalance(0);

          setError(
            "Your RYDO user account was not found."
          );

          return;
        }

        const data = snapshot.data();

        const balance = Number(
          data.wallet ??
            data.walletBalance ??
            0
        );

        if (Number.isFinite(balance)) {
          setWalletBalance(
            Math.max(0, balance)
          );
        } else {
          setWalletBalance(0);

          setError(
            "Your wallet balance is invalid."
          );
        }
      },
      (walletError) => {
        console.error(
          "RYDO WALLET LISTENER ERROR:",
          walletError
        );

        setWalletBalance(0);

        setError(
          "Unable to read your wallet balance."
        );
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  /* ==========================================================
     AVAILABLE RIDES
  ========================================================== */

  const availableRides = useMemo(() => {
    return rides.map((ride) => ({
      ...ride,

      fare: Math.round(
        ride.baseFare +
          Math.max(distanceKm, 1) *
            ride.perKm
      ),
    }));
  }, [distanceKm]);

  /* ==========================================================
     WALLET CHECK
  ========================================================== */

  const hasInsufficientWalletBalance =
    paymentMethod === "wallet" &&
    selectedRide &&
    Number(walletBalance) <
      Number(selectedRide.fare);

  /* ==========================================================
     FIND RIDES
  ========================================================== */

  const findRides = () => {
    setError("");

    if (!pickup) {
      setError(
        "Please select a pickup location from the suggestions."
      );

      return;
    }

    if (!destination) {
      setError(
        "Please select a destination from the suggestions."
      );

      return;
    }

    const pickupCoordinates =
      getCoordinates(pickup);

    const destinationCoordinates =
      getCoordinates(destination);

    const pickupLat =
      pickupCoordinates?.lat;

    const pickupLng =
      pickupCoordinates?.lng;

    const destinationLat =
      destinationCoordinates?.lat;

    const destinationLng =
      destinationCoordinates?.lng;

    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng) ||
      !Number.isFinite(destinationLat) ||
      !Number.isFinite(destinationLng)
    ) {
      setError(
        "Invalid location coordinates. Please select both locations again."
      );

      return;
    }

    if (
      pickupLat === destinationLat &&
      pickupLng === destinationLng
    ) {
      setError(
        "Pickup and destination cannot be the same."
      );

      return;
    }

    const calculatedDistance =
      calculateDistanceKm(
        pickup,
        destination
      );

    const roundedDistance =
      Math.round(
        calculatedDistance * 10
      ) / 10;

    if (
      !Number.isFinite(roundedDistance) ||
      roundedDistance <= 0
    ) {
      setError(
        "Unable to calculate route distance. Please select the locations again."
      );

      return;
    }

    setDistanceKm(
      roundedDistance
    );

    setShowRides(true);

    setSelectedRide(null);

    setTimeout(() => {
      document
        .getElementById(
          "available-rides"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
  };

  /* ==========================================================
     SELECT RIDE
  ========================================================== */

  const chooseRide = (ride) => {
    if (
      bookingConfirmed ||
      bookingProcessing
    ) {
      return;
    }

    setSelectedRide(ride);
    setError("");
  };

  /* ==========================================================
     PAYMENT METHOD
  ========================================================== */

  const changePaymentMethod = (
    method
  ) => {
    if (
      bookingConfirmed ||
      bookingProcessing
    ) {
      return;
    }

    setPaymentMethod(method);
    setError("");
  };

  /* ==========================================================
     CLOSE OTP MODAL
  ========================================================== */

  const closeOtpModal = () => {
    if (otpVerifying) {
      return;
    }

    setShowOtpModal(false);
    setOtpInput("");
    setOtpError("");
  };

  /* ==========================================================
     ACTUAL FIRESTORE BOOKING
  ========================================================== */

  const completeBookingAfterOtp =
    async () => {
      console.log(
        "================================"
      );

      console.log(
        "RYDO OTP VERIFIED - BOOKING RIDE"
      );

      console.log(
        "================================"
      );

      const user =
        auth.currentUser ||
        currentUser;

      if (!user) {
        throw new Error(
          "Please login before booking a ride."
        );
      }

      const pickupCoordinates =
        getCoordinates(pickup);

      const destinationCoordinates =
        getCoordinates(destination);

      if (
        !pickupCoordinates ||
        !destinationCoordinates
      ) {
        throw new Error(
          "Invalid pickup or destination coordinates."
        );
      }

      const pickupLat =
        pickupCoordinates.lat;

      const pickupLng =
        pickupCoordinates.lng;

      const destinationLat =
        destinationCoordinates.lat;

      const destinationLng =
        destinationCoordinates.lng;

      const driver =
        driverData[
          selectedRide.name
        ];

      if (!driver) {
        throw new Error(
          "Driver information is unavailable."
        );
      }

      const fare = Number(
        selectedRide.fare
      );

      if (
        !Number.isFinite(fare) ||
        fare <= 0
      ) {
        throw new Error(
          "Invalid ride fare."
        );
      }

      /*
        Make sure the OTP exists.
        Normally it was generated in confirmBooking().
      */
      const bookingOtp =
        rideOtp || generateRideOtp();

      setRideOtp(bookingOtp);

      /* ======================================================
         WALLET PRE-CHECK
      ====================================================== */

      if (
        paymentMethod === "wallet"
      ) {
        const balance =
          Number(walletBalance);

        if (!Number.isFinite(balance)) {
          throw new Error(
            "Unable to read your RYDO Wallet balance."
          );
        }

        if (balance < fare) {
          throw new Error(
            `Insufficient wallet balance. Available ₹${balance}, required ₹${fare}.`
          );
        }
      }

      /* ======================================================
         IDS
      ====================================================== */

      const generatedBookingId =
        "RYDO-" +
        Date.now()
          .toString()
          .slice(-8) +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

      const paymentId =
        "RYDO-PAY-" +
        Date.now()
          .toString()
          .slice(-8) +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

      /* ======================================================
         FIRESTORE REFERENCES
      ====================================================== */

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const rideRef = doc(
        collection(db, "rides")
      );

      /* ======================================================
         RIDE DATA
      ====================================================== */

      const rideData = {
        userId: user.uid,

        rideId:
          generatedBookingId,

        paymentId,

        pickup:
          getLocationName(pickup),

        pickupShortName:
          getShortLocationName(
            pickup
          ),

        pickupLat,

        pickupLng,

        destination:
          getLocationName(
            destination
          ),

        destinationShortName:
          getShortLocationName(
            destination
          ),

        destinationLat,

        destinationLng,

        latitude:
          pickupLat,

        longitude:
          pickupLng,

        pickupLatitude:
          pickupLat,

        pickupLongitude:
          pickupLng,

        destinationLatitude:
          destinationLat,

        destinationLongitude:
          destinationLng,

        distanceKm:
          Number(
            Number(
              distanceKm || 0
            ).toFixed(2)
          ),

        rideType:
          selectedRide.name,

        driver:
          driver.driver,

        driverPhone:
          driver.phone,

        vehicle:
          driver.vehicleType,

        vehicleNumber:
          driver.vehicle,

        rating:
          Number(driver.rating),

        fare,

        eta:
          Number(
            selectedRide.arrival
          ),

        status:
          "Driver Assigned",

        paymentStatus:
          paymentMethod ===
          "wallet"
            ? "Paid"
            : "Pending",

        paymentMethod,

        paidAmount:
          paymentMethod ===
          "wallet"
            ? fare
            : 0,

        walletDeducted:
          paymentMethod ===
          "wallet",

        /*
          IMPORTANT:
          This is the 4-digit OTP that the
          passenger gives to the driver.
        */
        rideOtp:
          bookingOtp,

        otp:
          bookingOtp,

        otpVerified:
          true,

        otpType:
          "ride",

        createdAt:
          serverTimestamp(),
      };

      console.log(
        "RYDO RIDE:",
        rideData
      );

      console.log(
        "RYDO RIDE OTP:",
        bookingOtp
      );

      /* ======================================================
         ATOMIC FIRESTORE TRANSACTION
      ====================================================== */

      await runTransaction(
        db,
        async (transaction) => {
          const userSnapshot =
            await transaction.get(
              userRef
            );

          if (
            !userSnapshot.exists()
          ) {
            throw new Error(
              "Your RYDO user account was not found."
            );
          }

          const userData =
            userSnapshot.data();

          const currentWallet =
            Number(
              userData.wallet ??
                userData.walletBalance ??
                0
            );

          if (
            !Number.isFinite(
              currentWallet
            )
          ) {
            throw new Error(
              "Your RYDO Wallet balance is invalid."
            );
          }

          console.log(
            "CURRENT FIREBASE WALLET:",
            currentWallet
          );

          console.log(
            "RIDE FARE:",
            fare
          );

          /* ==================================================
             WALLET PAYMENT
          ================================================== */

          if (
            paymentMethod ===
            "wallet"
          ) {
            if (
              currentWallet <
              fare
            ) {
              throw new Error(
                `Insufficient wallet balance. Available ₹${currentWallet}, required ₹${fare}.`
              );
            }

            const newBalance =
              currentWallet - fare;

            console.log(
              "WALLET:",
              currentWallet,
              "→",
              newBalance
            );

            const walletTransaction =
              {
                id: paymentId,

                title:
                  "Ride Payment",

                description:
                  `Ride Payment - ${generatedBookingId}`,

                amount: fare,

                type: "Debit",

                status:
                  "Completed",

                rideId:
                  generatedBookingId,

                paymentId,

                paymentMethod:
                  "wallet",

                date:
                  new Date().toISOString(),
              };

            transaction.update(
              userRef,
              {
                wallet:
                  newBalance,

                walletBalance:
                  newBalance,

                transactions:
                  arrayUnion(
                    walletTransaction
                  ),
              }
            );
          }

          /* ==================================================
             CREATE RIDE
          ================================================== */

          transaction.set(
            rideRef,
            rideData
          );
        }
      );

      /* ======================================================
         PAYMENT SUCCESS
      ====================================================== */

      console.log(
        "RYDO PAYMENT SUCCESSFUL"
      );

      console.log(
        "Ride ID:",
        rideRef.id
      );

      console.log(
        "Booking ID:",
        generatedBookingId
      );

      console.log(
        "Amount Paid:",
        fare
      );

      console.log(
        "RIDE OTP:",
        bookingOtp
      );

      setRideDocId(
        rideRef.id
      );

      setBookingId(
        generatedBookingId
      );

      /*
        Keep the generated OTP visible after booking.
      */
      setRideOtp(
        bookingOtp
      );

      if (
        paymentMethod ===
        "wallet"
      ) {
        setWalletBalance(
          (previousBalance) =>
            Math.max(
              0,
              Number(
                previousBalance
              ) - fare
            )
        );
      }

      setBookingConfirmed(
        true
      );

      /* ======================================================
         JOURNEY INITIALIZATION
      ====================================================== */

      setJourneyStage(1);

      setJourneyProgress(0);

      journeyStartRef.current =
        Date.now();

      lastJourneyStageRef.current =
        1;

      const initialDriverLocation =
        createDriverStartPoint(
          {
            lat: pickupLat,
            lng: pickupLng,
          },
          {
            lat: destinationLat,
            lng: destinationLng,
          },
          Math.min(
            1.5,
            Math.max(
              0.5,
              Number(
                distanceKm || 1
              ) / 3
            )
          )
        ) || {
          lat: pickupLat,
          lng: pickupLng,
        };

      setDriverStartLocation(
        initialDriverLocation
      );

      setDriverLocation(
        initialDriverLocation
      );

      setError("");

      setTimeout(() => {
        confirmationRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          }
        );
      }, 300);
    };

  /* ==========================================================
     CONFIRM BOOKING
     
     Generates a NEW 4-digit OTP and opens verification modal.
  ========================================================== */

  const confirmBooking = () => {
    console.log(
      "================================"
    );

    console.log(
      "RYDO CONFIRM & PAY CLICKED"
    );

    console.log(
      "================================"
    );

    if (
      bookingProcessing ||
      bookingConfirmed
    ) {
      return;
    }

    setError("");

    const user =
      auth.currentUser ||
      currentUser;

    if (!user) {
      setError(
        "Please login before booking a ride."
      );

      navigate("/login");

      return;
    }

    if (!pickup) {
      setError(
        "Please select a pickup location."
      );

      return;
    }

    if (!destination) {
      setError(
        "Please select a destination."
      );

      return;
    }

    if (!selectedRide) {
      setError(
        "Please select a ride."
      );

      return;
    }

    const pickupCoordinates =
      getCoordinates(pickup);

    const destinationCoordinates =
      getCoordinates(destination);

    if (
      !pickupCoordinates ||
      !destinationCoordinates
    ) {
      setError(
        "Invalid pickup or destination coordinates. Please select both locations again."
      );

      return;
    }

    const fare = Number(
      selectedRide.fare
    );

    if (
      !Number.isFinite(fare) ||
      fare <= 0
    ) {
      setError(
        "Invalid ride fare."
      );

      return;
    }

    /* ======================================================
       WALLET PRE-CHECK
    ====================================================== */

    if (
      paymentMethod === "wallet"
    ) {
      const balance =
        Number(walletBalance);

      if (!Number.isFinite(balance)) {
        setError(
          "Unable to read your RYDO Wallet balance."
        );

        return;
      }

      if (balance < fare) {
        setError(
          `Insufficient wallet balance. Available ₹${balance}, required ₹${fare}.`
        );

        return;
      }
    }

    /* ======================================================
       GENERATE NEW 4-DIGIT OTP
    ====================================================== */

    const newOtp =
      generateRideOtp();

    setRideOtp(
      newOtp
    );

    setOtpInput(
      newOtp
    );

    setOtpError("");

    /*
      The user can see the OTP in the modal.
      They can give this code to the driver.
    */

    setShowOtpModal(
      true
    );
  };

  /* ==========================================================
     VERIFY RIDE OTP
  ========================================================== */

  const verifyRideOtp =
    async () => {
      setOtpError("");

      if (
        otpInput.length !== 4
      ) {
        setOtpError(
          "Please enter the 4-digit OTP."
        );

        return;
      }

      if (
        otpInput !== rideOtp
      ) {
        setOtpError(
          "Invalid OTP. Please enter the 4-digit OTP shown above."
        );

        return;
      }

      setOtpVerifying(
        true
      );

      setBookingProcessing(
        true
      );

      try {
        console.log(
          "RYDO OTP VERIFIED:",
          rideOtp
        );

        setShowOtpModal(
          false
        );

        setOtpInput("");

        setOtpError("");

        await completeBookingAfterOtp();
      } catch (
        bookingError
      ) {
        console.error(
          "================================"
        );

        console.error(
          "RYDO BOOKING ERROR:",
          bookingError
        );

        console.error(
          "ERROR CODE:",
          bookingError?.code
        );

        console.error(
          "ERROR MESSAGE:",
          bookingError?.message
        );

        console.error(
          "================================"
        );

        setBookingConfirmed(
          false
        );

        const errorCode =
          bookingError?.code ||
          "";

        const errorMessage =
          bookingError?.message ||
          "";

        if (
          errorMessage
            .toLowerCase()
            .includes(
              "insufficient wallet"
            )
        ) {
          setError(
            errorMessage
          );
        } else if (
          errorCode ===
          "permission-denied"
        ) {
          setError(
            "Firebase permission denied. Check your Firestore rules for the users and rides collections."
          );
        } else if (
          errorCode ===
          "unauthenticated"
        ) {
          setError(
            "Your login session expired. Please login again."
          );
        } else if (
          errorCode ===
          "failed-precondition"
        ) {
          setError(
            "Firestore is not configured correctly for this transaction."
          );
        } else {
          setError(
            errorMessage ||
              "Booking failed. Please try again."
          );
        }
      } finally {
        setOtpVerifying(
          false
        );

        setBookingProcessing(
          false
        );
      }
    };

  /* ==========================================================
     CONNECTED JOURNEY CLOCK
  ========================================================== */

  useEffect(() => {
    if (
      !bookingConfirmed ||
      !rideDocId ||
      !selectedRide ||
      !pickup ||
      !destination
    ) {
      if (
        journeyFrameRef.current
      ) {
        cancelAnimationFrame(
          journeyFrameRef.current
        );

        journeyFrameRef.current =
          null;
      }

      return undefined;
    }

    const pickupCoordinates =
      getCoordinates(pickup);

    const destinationCoordinates =
      getCoordinates(
        destination
      );

    if (
      !pickupCoordinates ||
      !destinationCoordinates
    ) {
      return undefined;
    }

    if (
      !journeyStartRef.current
    ) {
      journeyStartRef.current =
        Date.now();
    }

    const assignedMs =
      5000;

    const arrivalMs =
      Math.max(
        Number(
          selectedRide.arrival
        ) || 1,
        1
      ) * 30000;

    const arrivedMs =
      10000;

    const tripMs =
      Math.max(
        90000,
        Math.min(
          240000,
          Math.max(
            distanceKm * 15000,
            90000
          )
        )
      );

    const totalMs =
      assignedMs +
      arrivalMs +
      arrivedMs +
      tripMs;

    const driverStart =
      createDriverStartPoint(
        pickupCoordinates,
        destinationCoordinates,
        Math.min(
          1.5,
          Math.max(
            0.5,
            distanceKm / 3
          )
        )
      ) ||
      pickupCoordinates;

    const updateFirestoreStatus =
      async (
        stage,
        status
      ) => {
        if (
          lastJourneyStageRef.current ===
          stage
        ) {
          return;
        }

        lastJourneyStageRef.current =
          stage;

        try {
          const updates = {
            status,
          };

          if (stage === 5) {
            updates.completedAt =
              serverTimestamp();
          }

          await updateDoc(
            doc(
              db,
              "rides",
              rideDocId
            ),
            updates
          );
        } catch (
          statusError
        ) {
          console.error(
            "JOURNEY STATUS UPDATE ERROR:",
            statusError
          );
        }
      };

    const interpolate = (
      a,
      b,
      t
    ) => ({
      lat:
        a.lat +
        (b.lat - a.lat) *
          t,

      lng:
        a.lng +
        (b.lng - a.lng) *
          t,
    });

    const tick = () => {
      const elapsed =
        Math.max(
          0,
          Date.now() -
            journeyStartRef.current
        );

      const clampedElapsed =
        Math.min(
          elapsed,
          totalMs
        );

      const overallProgress =
        totalMs > 0
          ? clampedElapsed /
            totalMs
          : 1;

      let stage = 1;

      let location =
        driverStart;

      if (
        elapsed <
        assignedMs
      ) {
        stage = 1;

        location =
          driverStart;
      } else if (
        elapsed <
        assignedMs +
          arrivalMs
      ) {
        stage = 2;

        const local =
          (elapsed -
            assignedMs) /
          arrivalMs;

        location =
          interpolate(
            driverStart,
            pickupCoordinates,
            Math.min(
              1,
              Math.max(
                0,
                local
              )
            )
          );
      } else if (
        elapsed <
        assignedMs +
          arrivalMs +
          arrivedMs
      ) {
        stage = 3;

        location =
          pickupCoordinates;
      } else if (
        elapsed <
        totalMs
      ) {
        stage = 4;

        const local =
          (elapsed -
            assignedMs -
            arrivalMs -
            arrivedMs) /
          tripMs;

        location =
          interpolate(
            pickupCoordinates,
            destinationCoordinates,
            Math.min(
              1,
              Math.max(
                0,
                local
              )
            )
          );
      } else {
        stage = 5;

        location =
          destinationCoordinates;
      }

      setJourneyStage(
        stage
      );

      setJourneyProgress(
        overallProgress
      );

      setDriverLocation(
        location
      );

      if (stage === 2) {
        updateFirestoreStatus(
          stage,
          "Driver Arriving"
        );
      } else if (
        stage === 3
      ) {
        updateFirestoreStatus(
          stage,
          "Driver Arrived"
        );
      } else if (
        stage === 4
      ) {
        updateFirestoreStatus(
          stage,
          "Ride Started"
        );
      } else if (
        stage === 5
      ) {
        updateFirestoreStatus(
          stage,
          "Ride Completed"
        );
      }

      if (
        elapsed <
        totalMs
      ) {
        journeyFrameRef.current =
          requestAnimationFrame(
            tick
          );
      } else {
        journeyFrameRef.current =
          null;
      }
    };

    tick();

    return () => {
      if (
        journeyFrameRef.current
      ) {
        cancelAnimationFrame(
          journeyFrameRef.current
        );

        journeyFrameRef.current =
          null;
      }
    };
  }, [
    bookingConfirmed,
    rideDocId,
    selectedRide,
    pickup,
    destination,
    distanceKm,
  ]);

  /* ==========================================================
     DRIVER
  ========================================================== */

  const selectedDriver =
    selectedRide
      ? driverData[
          selectedRide.name
        ]
      : null;

  /* ==========================================================
     STATUS
  ========================================================== */

  const currentStatus =
    journeyStage >= 5
      ? "Ride Completed"
      : journeyStage === 4
      ? "Ride Started"
      : journeyStage === 3
      ? "Driver Arrived"
      : journeyStage === 2
      ? "Driver Arriving"
      : journeyStage === 1
      ? "Driver Assigned"
      : "Waiting for booking";

  /* ==========================================================
     CHAT
  ========================================================== */

  const chatWithDriver = () => {
    if (!selectedDriver) {
      setError(
        "Driver information is not available."
      );

      return;
    }

    setError("");

    setChatOpen(true);
  };

  const sendChatMessage = () => {
    const message =
      chatMessage.trim();

    if (!message) {
      return;
    }

    setChatMessages(
      (previousMessages) => [
        ...previousMessages,

        {
          id: Date.now(),
          sender: "user",
          text: message,
        },
      ]
    );

    setChatMessage("");

    setTimeout(() => {
      setChatMessages(
        (previousMessages) => [
          ...previousMessages,

          {
            id:
              Date.now() + 1,

            sender:
              "driver",

            text:
              "Okay, I'm on my way.",
          },
        ]
      );
    }, 1000);
  };

  /* ==========================================================
     CALL DRIVER
  ========================================================== */

  const callDriver = () => {
    if (
      !selectedDriver?.phone
    ) {
      setError(
        "Driver phone number is not available."
      );

      return;
    }

    window.location.href =
      `tel:${selectedDriver.phone}`;
  };

  /* ==========================================================
     CANCEL RIDE
  ========================================================== */

  const cancelRide =
    async () => {
      setError("");

      if (rideDocId) {
        try {
          await updateDoc(
            doc(
              db,
              "rides",
              rideDocId
            ),
            {
              status:
                "Cancelled",

              cancelledAt:
                serverTimestamp(),
            }
          );
        } catch (
          cancelError
        ) {
          console.error(
            "CANCEL RIDE ERROR:",
            cancelError
          );

          setError(
            "Unable to update the ride cancellation status."
          );

          return;
        }
      }

      setBookingConfirmed(
        false
      );

      setBookingProcessing(
        false
      );

      setBookingId("");

      setRideDocId("");

      setRideOtp("");

      setOtpInput("");

      setJourneyStage(0);

      setJourneyProgress(0);

      journeyStartRef.current =
        null;

      lastJourneyStageRef.current =
        0;

      if (
        journeyFrameRef.current
      ) {
        cancelAnimationFrame(
          journeyFrameRef.current
        );

        journeyFrameRef.current =
          null;
      }

      setDriverLocation(
        null
      );

      setDriverStartLocation(
        null
      );

      setSelectedRide(
        null
      );

      setChatOpen(false);

      setChatMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* ==========================================================
     HOME
  ========================================================== */

  const goToHome = () => {
    navigate("/");
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#070A12] text-white">

      {/* ======================================================
          HERO
      ====================================================== */}

      <div className="relative overflow-hidden px-4 md:px-8 py-6 md:py-10">

        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#FFBE0B]/10 blur-[120px] pointer-events-none" />

        <div className="absolute top-[400px] -left-40 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">

          {/* TOP BAR */}

          <div className="flex items-center justify-between mb-8">

            <button
              type="button"
              onClick={goToHome}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition"
            >
              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                ←
              </div>

              <span className="font-bold hidden sm:block">
                Back to Home
              </span>
            </button>

            <div className="flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

              <span className="text-xs text-gray-500 font-black uppercase tracking-widest">
                RYDO Online
              </span>

            </div>

          </div>

          {/* HERO CARD */}

          <div className="relative rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#151B2B] via-[#0F1422] to-[#080B12] p-6 md:p-10 overflow-hidden shadow-2xl">

            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#FFBE0B]/10 blur-3xl pointer-events-none" />

            <div className="relative">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center text-2xl shadow-lg shadow-[#FFBE0B]/20">
                  🚕
                </div>

                <div>

                  <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.25em]">
                    RYDO RIDE
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Safe • Fast • Reliable
                  </p>

                </div>

              </div>

              <div className="max-w-3xl">

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">

                  Where do you{" "}

                  <span className="text-[#FFBE0B]">
                    want to go?
                  </span>

                </h1>

                <p className="text-gray-400 mt-5 text-base md:text-lg max-w-2xl">
                  Choose your pickup and destination.
                  We'll find the best RYDO rides
                  available for you.
                </p>

              </div>

              {/* BOOKING PANEL */}

              <div className="mt-9 rounded-[2rem] border border-white/10 bg-black/30 backdrop-blur-xl p-5 md:p-7">

                <div className="grid lg:grid-cols-2 gap-5">

                  {/* PICKUP */}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">

                    <div className="flex items-center gap-3 mb-3">

                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

                        <span className="text-emerald-400 text-lg">
                          ●
                        </span>

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                          Pickup
                        </p>

                        <p className="text-sm font-black mt-1">
                          Starting point
                        </p>

                      </div>

                    </div>

                    <LocationAutocomplete
                      label=""
                      placeholder="Search pickup location..."
                      value={pickup}
                      onSelect={(location) => {
                        setPickup(location);
                        setShowRides(false);
                        setSelectedRide(null);
                        setError("");
                      }}
                    />

                  </div>

                  {/* DESTINATION */}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">

                    <div className="flex items-center gap-3 mb-3">

                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">

                        <span className="text-red-400 text-lg">
                          ●
                        </span>

                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                          Destination
                        </p>

                        <p className="text-sm font-black mt-1">
                          Where you're going
                        </p>

                      </div>

                    </div>

                    <LocationAutocomplete
                      label=""
                      placeholder="Search destination..."
                      value={destination}
                      onSelect={(location) => {
                        setDestination(location);
                        setShowRides(false);
                        setSelectedRide(null);
                        setError("");
                      }}
                    />

                  </div>

                </div>

                <div className="mt-5">

                  <button
                    type="button"
                    onClick={findRides}
                    className="group w-full min-h-[72px] rounded-2xl bg-[#FFBE0B] text-black px-8 font-black text-lg hover:scale-[1.01] hover:shadow-xl hover:shadow-[#FFBE0B]/20 transition-all flex items-center justify-center gap-3"
                  >
                    <span>
                      Find My Ride
                    </span>

                    <span className="text-xl group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>

                </div>

                {error && (
                  <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-400 text-sm font-bold">
                    {error}
                  </div>
                )}

              </div>

              <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-6 text-xs text-gray-500 font-bold">

                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">
                    ✓
                  </span>
                  Verified drivers
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">
                    ✓
                  </span>
                  Transparent pricing
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">
                    ✓
                  </span>
                  Secure payments
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">
                    ✓
                  </span>
                  Live tracking
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          AVAILABLE RIDES
      ====================================================== */}

      {showRides && (
        <div
          id="available-rides"
          className="max-w-7xl mx-auto px-4 md:px-8 pb-8"
        >

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

              <div>

                <div className="flex items-center gap-3">

                  <span className="w-2 h-2 rounded-full bg-[#FFBE0B]" />

                  <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                    Ride Options
                  </p>

                </div>

                <h2 className="text-3xl md:text-4xl font-black mt-3">
                  Choose your ride
                </h2>

                <p className="text-gray-500 mt-2">
                  Pick the ride that fits your journey.
                </p>

                <div className="flex flex-wrap gap-3 mt-4">

                  <div className="inline-flex items-center gap-2 rounded-xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 px-4 py-2">

                    <span>
                      📍
                    </span>

                    <span className="text-sm font-black text-[#FFBE0B]">
                      {distanceKm} km
                    </span>

                  </div>

                </div>

              </div>

              <div className="rounded-2xl bg-black/30 border border-white/10 px-5 py-4">

                <p className="text-xs text-gray-500">
                  Route
                </p>

                <p className="text-sm font-black mt-1">

                  {getShortLocationName(
                    pickup
                  ) ||
                    "Pickup"}

                  <span className="text-[#FFBE0B]">
                    {" "}→{" "}
                  </span>

                  {getShortLocationName(
                    destination
                  ) ||
                    "Destination"}

                </p>

              </div>

            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-8">

              {availableRides.map(
                (ride) => {
                  const selected =
                    selectedRide?.id ===
                    ride.id;

                  return (
                    <button
                      key={ride.id}
                      type="button"
                      onClick={() =>
                        chooseRide(
                          ride
                        )
                      }
                      disabled={
                        bookingProcessing ||
                        bookingConfirmed
                      }
                      className={`group relative text-left rounded-[1.75rem] border p-5 md:p-6 transition-all ${
                        selected
                          ? "border-[#FFBE0B] bg-[#FFBE0B]/10 shadow-xl shadow-[#FFBE0B]/5"
                          : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/[0.04]"
                      } ${
                        bookingProcessing ||
                        bookingConfirmed
                          ? "cursor-not-allowed opacity-70"
                          : ""
                      }`}
                    >

                      {selected && (
                        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFBE0B] text-black flex items-center justify-center font-black">
                          ✓
                        </div>
                      )}

                      <div className="flex items-center gap-5">

                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center text-4xl group-hover:scale-105 transition">
                          {ride.icon}
                        </div>

                        <div>

                          <p className="text-2xl font-black">
                            {ride.name}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {ride.description}
                          </p>

                          <div className="flex gap-3 mt-3">

                            <span className="text-xs text-gray-400">
                              ⚡ {ride.arrival} min
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="flex items-end justify-between mt-6 pt-5 border-t border-white/10">

                        <div>

                          <p className="text-xs text-gray-500">
                            Estimated fare
                          </p>

                          <p className="text-2xl font-black text-[#FFBE0B] mt-1">
                            ₹{ride.fare}
                          </p>

                        </div>

                        <span
                          className={`text-sm font-black ${
                            selected
                              ? "text-[#FFBE0B]"
                              : "text-gray-500"
                          }`}
                        >
                          {selected
                            ? "Selected"
                            : "Select ride →"}
                        </span>

                      </div>

                    </button>
                  );
                }
              )}

            </div>

            {/* PAYMENT */}

            {selectedRide && (
              <div className="mt-8 rounded-[2rem] border border-[#FFBE0B]/20 bg-[#FFBE0B]/[0.045] p-6 md:p-8">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                  <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-3xl">
                      {selectedRide.icon}
                    </div>

                    <div>

                      <p className="text-xs text-gray-500 uppercase tracking-widest font-black">
                        Your selection
                      </p>

                      <h3 className="text-2xl font-black mt-1">
                        {selectedRide.name}
                      </h3>

                    </div>

                  </div>

                  <div className="text-right">

                    <p className="text-xs text-gray-500">
                      Total Fare
                    </p>

                    <p className="text-3xl font-black text-[#FFBE0B]">
                      ₹{selectedRide.fare}
                    </p>

                  </div>

                </div>

                <div className="mt-8 border-t border-white/10 pt-8">

                  <p className="text-xs text-[#FFBE0B] uppercase tracking-widest font-black">
                    Payment
                  </p>

                  <h3 className="text-2xl font-black mt-2">
                    How would you like to pay?
                  </h3>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

                    {/* WALLET */}

                    <button
                      type="button"
                      onClick={() =>
                        changePaymentMethod(
                          "wallet"
                        )
                      }
                      disabled={
                        bookingProcessing ||
                        bookingConfirmed
                      }
                      className={`text-left rounded-2xl border p-5 transition ${
                        paymentMethod ===
                        "wallet"
                          ? "border-[#FFBE0B] bg-[#FFBE0B]/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >

                      <div className="text-2xl">
                        💳
                      </div>

                      <p className="font-black mt-3">
                        RYDO Wallet
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        ₹{walletBalance} available
                      </p>

                    </button>

                    {/* UPI */}

                    <button
                      type="button"
                      onClick={() =>
                        changePaymentMethod(
                          "upi"
                        )
                      }
                      disabled={
                        bookingProcessing ||
                        bookingConfirmed
                      }
                      className={`text-left rounded-2xl border p-5 transition ${
                        paymentMethod ===
                        "upi"
                          ? "border-[#FFBE0B] bg-[#FFBE0B]/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >

                      <div className="text-2xl">
                        📱
                      </div>

                      <p className="font-black mt-3">
                        UPI
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Pay instantly
                      </p>

                    </button>

                    {/* CARD */}

                    <button
                      type="button"
                      onClick={() =>
                        changePaymentMethod(
                          "card"
                        )
                      }
                      disabled={
                        bookingProcessing ||
                        bookingConfirmed
                      }
                      className={`text-left rounded-2xl border p-5 transition ${
                        paymentMethod ===
                        "card"
                          ? "border-[#FFBE0B] bg-[#FFBE0B]/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >

                      <div className="text-2xl">
                        💳
                      </div>

                      <p className="font-black mt-3">
                        Card
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Credit or debit
                      </p>

                    </button>

                    {/* CASH */}

                    <button
                      type="button"
                      onClick={() =>
                        changePaymentMethod(
                          "cash"
                        )
                      }
                      disabled={
                        bookingProcessing ||
                        bookingConfirmed
                      }
                      className={`text-left rounded-2xl border p-5 transition ${
                        paymentMethod ===
                        "cash"
                          ? "border-[#FFBE0B] bg-[#FFBE0B]/10"
                          : "border-white/10 bg-black/20 hover:border-white/30"
                      }`}
                    >

                      <div className="text-2xl">
                        💵
                      </div>

                      <p className="font-black mt-3">
                        Cash
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Pay driver directly
                      </p>

                    </button>

                  </div>

                  {/* WALLET INFO */}

                  {paymentMethod ===
                    "wallet" && (
                    <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-5">

                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-xs text-gray-500">
                            RYDO Wallet Balance
                          </p>

                          <p className="text-2xl font-black text-[#FFBE0B] mt-1">
                            ₹{walletBalance}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Ride Fare
                          </p>

                          <p className="text-xl font-black mt-1">
                            ₹{selectedRide.fare}
                          </p>

                        </div>

                      </div>

                      {hasInsufficientWalletBalance && (
                        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                          <p className="text-red-400 font-black">
                            ⚠ Insufficient Wallet Balance
                          </p>

                          <p className="text-sm text-red-300/80 mt-1">
                            Add money to your RYDO Wallet or choose another payment method before booking.
                          </p>

                        </div>
                      )}

                    </div>
                  )}

                  {/* FARE BREAKDOWN */}

                  <div className="mt-6 rounded-2xl bg-black/30 border border-white/10 p-5">

                    <div className="flex justify-between">

                      <span className="text-gray-500">
                        Distance
                      </span>

                      <span className="font-black">
                        {distanceKm} km
                      </span>

                    </div>

                    <div className="flex justify-between mt-3">

                      <span className="text-gray-500">
                        Base Fare
                      </span>

                      <span className="font-black">
                        ₹{selectedRide.baseFare}
                      </span>

                    </div>

                    <div className="flex justify-between mt-3">

                      <span className="text-gray-500">
                        Distance Fare
                      </span>

                      <span className="font-black">
                        ₹
                        {Math.round(
                          distanceKm *
                            selectedRide.perKm
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between mt-4 pt-4 border-t border-white/10">

                      <span className="font-black">
                        Total
                      </span>

                      <span className="text-xl font-black text-[#FFBE0B]">
                        ₹{selectedRide.fare}
                      </span>

                    </div>

                  </div>

                  {/* CONFIRM BUTTON */}

                  <button
                    type="button"
                    onClick={
                      confirmBooking
                    }
                    disabled={
                      bookingProcessing ||
                      bookingConfirmed ||
                      !selectedRide
                    }
                    className={`mt-6 w-full py-5 rounded-2xl font-black text-xl transition ${
                      bookingProcessing ||
                      bookingConfirmed ||
                      !selectedRide
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-[#FFBE0B] text-black hover:scale-[1.01] hover:shadow-xl hover:shadow-[#FFBE0B]/20"
                    }`}
                  >
                    {bookingProcessing
                      ? "Processing..."
                      : bookingConfirmed
                      ? "Ride Booked ✓"
                      : paymentMethod ===
                        "wallet"
                      ? `Confirm & Pay ₹${selectedRide.fare}`
                      : "Confirm & Book Ride →"}
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-3">
                    A 4-digit ride OTP will be generated for this booking.
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          BOOKING CONFIRMATION
      ====================================================== */}

      {bookingConfirmed &&
        selectedRide && (
          <div
            ref={confirmationRef}
            id="booking-confirmation"
            className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-6"
          >

            {/* CONFIRMATION */}

            <div className="rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.02] p-6 md:p-8">

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xl font-black">
                      ✓
                    </div>

                    <div>

                      <p className="text-emerald-400 text-xs uppercase tracking-widest font-black">
                        Booking Confirmed
                      </p>

                      <h2 className="text-3xl md:text-4xl font-black mt-1">
                        Your ride is booked
                      </h2>

                    </div>

                  </div>

                  <p className="text-gray-500 mt-4">
                    Your RYDO driver has been assigned.
                    Track your journey below.
                  </p>

                </div>

                <div className="rounded-2xl bg-black/30 border border-white/10 px-5 py-4">

                  <p className="text-xs text-gray-500">
                    Booking ID
                  </p>

                  <p className="font-black text-[#FFBE0B] mt-1">
                    {bookingId}
                  </p>

                </div>

              </div>

              {/* ==================================================
                  RIDE OTP — MAIN DISPLAY
              ================================================== */}

              <div className="mt-7 rounded-[2rem] border-2 border-[#FFBE0B]/40 bg-gradient-to-br from-[#FFBE0B]/15 to-[#FFBE0B]/5 p-6 md:p-8 shadow-xl shadow-[#FFBE0B]/5">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div>

                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-2xl bg-[#FFBE0B] text-black flex items-center justify-center text-2xl">
                        🔐
                      </div>

                      <div>

                        <p className="text-[#FFBE0B] text-xs uppercase tracking-[0.2em] font-black">
                          Ride Verification
                        </p>

                        <h3 className="text-2xl md:text-3xl font-black mt-1">
                          Your Ride OTP
                        </h3>

                      </div>

                    </div>

                    <p className="text-gray-300 mt-4 font-semibold">
                      Give this 4-digit OTP to your driver when you meet.
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      Keep this code private until the driver arrives.
                    </p>

                  </div>

                  <div className="rounded-2xl bg-black/40 border border-[#FFBE0B]/30 px-8 py-6 text-center min-w-[220px]">

                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-black">
                      RYDO OTP
                    </p>

                    <p className="text-4xl md:text-5xl font-black tracking-[0.35em] text-[#FFBE0B] mt-3">
                      {rideOtp}
                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Pickup
                  </p>

                  <p className="font-black mt-2">
                    {getShortLocationName(
                      pickup
                    )}
                  </p>

                </div>

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Destination
                  </p>

                  <p className="font-black mt-2">
                    {getShortLocationName(
                      destination
                    )}
                  </p>

                </div>

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Ride
                  </p>

                  <p className="font-black mt-2">
                    {selectedRide.icon}{" "}
                    {selectedRide.name}
                  </p>

                </div>

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Distance
                  </p>

                  <p className="font-black mt-2">
                    {distanceKm} km
                  </p>

                </div>

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Payment
                  </p>

                  <p className="font-black mt-2">
                    {paymentMethod ===
                    "wallet"
                      ? "RYDO Wallet"
                      : paymentMethod.toUpperCase()}
                  </p>

                </div>

                <div className="rounded-2xl bg-black/20 p-5">

                  <p className="text-xs text-gray-500">
                    Fare
                  </p>

                  <p className="font-black text-[#FFBE0B] mt-2">
                    ₹{selectedRide.fare}
                  </p>

                </div>

              </div>

              {paymentMethod ===
                "wallet" && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">

                  <p className="text-emerald-400 font-black">
                    ✓ Wallet payment successful
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    ₹{selectedRide.fare} has been deducted
                    from your RYDO Wallet.
                  </p>

                </div>
              )}

            </div>

            {/* DRIVER */}

            {selectedDriver && (
              <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

                <p className="text-xs uppercase tracking-widest text-gray-500 font-black">
                  Your Driver
                </p>

                <h2 className="text-3xl font-black mt-2">
                  Driver Information
                </h2>

                <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    <div className="flex items-center gap-5">

                      <div className="w-20 h-20 rounded-full bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-4xl">
                        👨
                      </div>

                      <div>

                        <div className="flex items-center gap-2">

                          <p className="text-2xl font-black">
                            {selectedDriver.driver}
                          </p>

                          {selectedDriver.verified && (
                            <span className="text-emerald-400 text-lg">
                              ✓
                            </span>
                          )}

                        </div>

                        <p className="text-gray-500 mt-1">
                          Professional RYDO Driver
                        </p>

                        <div className="flex items-center gap-3 mt-2">

                          <span className="text-[#FFBE0B] font-black">
                            ⭐ {selectedDriver.rating}
                          </span>

                          <span className="text-gray-600">
                            •
                          </span>

                          <span className="text-gray-500 text-sm">
                            {selectedDriver.totalRides} rides
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4">

                      <p className="text-xs text-gray-500">
                        Verification
                      </p>

                      <p className="text-emerald-400 font-black mt-1">
                        ✓ Verified Driver
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

                  <div className="rounded-xl bg-black/20 p-4">

                    <p className="text-xs text-gray-500">
                      Experience
                    </p>

                    <p className="font-black text-lg mt-1">
                      {selectedDriver.experience}
                    </p>

                  </div>

                  <div className="rounded-xl bg-black/20 p-4">

                    <p className="text-xs text-gray-500">
                      Rating
                    </p>

                    <p className="font-black text-lg mt-1 text-[#FFBE0B]">
                      ⭐ {selectedDriver.rating}
                    </p>

                  </div>

                  <div className="rounded-xl bg-black/20 p-4">

                    <p className="text-xs text-gray-500">
                      Total Rides
                    </p>

                    <p className="font-black text-lg mt-1">
                      {selectedDriver.totalRides}
                    </p>

                  </div>

                  <div className="rounded-xl bg-black/20 p-4">

                    <p className="text-xs text-gray-500">
                      Status
                    </p>

                    <p className="font-black text-lg mt-1 text-emerald-400">
                      Online
                    </p>

                  </div>

                </div>

                <div className="mt-6">

                  <p className="text-xs uppercase tracking-widest text-gray-500 font-black">
                    Vehicle Details
                  </p>

                  <div className="grid md:grid-cols-3 gap-3 mt-4">

                    <div className="rounded-xl bg-black/20 p-4">

                      <p className="text-xs text-gray-500">
                        Vehicle
                      </p>

                      <p className="font-black mt-1">
                        {selectedDriver.vehicleType}
                      </p>

                    </div>

                    <div className="rounded-xl bg-black/20 p-4">

                      <p className="text-xs text-gray-500">
                        Vehicle Number
                      </p>

                      <p className="font-black mt-1 text-[#FFBE0B]">
                        {selectedDriver.vehicle}
                      </p>

                    </div>

                    <div className="rounded-xl bg-black/20 p-4">

                      <p className="text-xs text-gray-500">
                        Vehicle Color
                      </p>

                      <p className="font-black mt-1">
                        {selectedDriver.vehicleColor}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4">

                  <button
                    type="button"
                    onClick={
                      chatWithDriver
                    }
                    className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-black hover:border-[#FFBE0B] hover:bg-[#FFBE0B]/10 transition"
                  >
                    💬 Chat with Driver
                  </button>

                  <button
                    type="button"
                    onClick={
                      callDriver
                    }
                    className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-black hover:border-emerald-400 hover:bg-emerald-400/10 transition"
                  >
                    📞 Call Driver
                  </button>

                </div>

              </div>
            )}

            {/* STATUS */}

            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <p className="text-xs uppercase tracking-widest text-gray-500 font-black">
                Current Ride Status
              </p>

              <div className="flex items-center gap-4 mt-4">

                <span
                  className={`w-4 h-4 rounded-full ${
                    journeyStage >= 5
                      ? "bg-emerald-400"
                      : "bg-[#FFBE0B] animate-pulse"
                  }`}
                />

                <p className="text-2xl font-black text-[#FFBE0B]">
                  {currentStatus}
                </p>

              </div>

              <p className="text-gray-500 mt-2">

                {journeyStage >= 5
                  ? "Your ride has been completed successfully."
                  : journeyStage === 4
                  ? "Your ride is currently moving toward the destination."
                  : journeyStage === 3
                  ? "Your driver has arrived at the pickup location."
                  : journeyStage === 2
                  ? "Your driver is travelling to the pickup location."
                  : "Your driver has been assigned."}

              </p>

            </div>

            {/* TIMELINE */}

            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <p className="text-xs uppercase tracking-widest text-[#FFBE0B] font-black">
                Journey Progress
              </p>

              <h2 className="text-3xl font-black mt-2">
                Ride Timeline
              </h2>

              <div className="mt-8 space-y-7">

                {[
                  {
                    stage: 1,
                    title:
                      "Driver Assigned",
                    text:
                      "A driver has accepted your ride.",
                  },

                  {
                    stage: 2,
                    title:
                      "Driver Arriving",
                    text:
                      "Your driver is travelling to pickup.",
                  },

                  {
                    stage: 3,
                    title:
                      "Driver Arrived",
                    text:
                      "Your driver has reached pickup.",
                  },

                  {
                    stage: 4,
                    title:
                      "Ride Started",
                    text:
                      "Your journey is in progress.",
                  },

                  {
                    stage: 5,
                    title:
                      "Destination Reached",
                    text:
                      "You have safely reached your destination.",
                  },
                ].map(
                  (item) => {
                    const completed =
                      journeyStage >
                      item.stage;

                    const active =
                      journeyStage ===
                      item.stage;

                    return (
                      <div
                        key={
                          item.stage
                        }
                        className="flex gap-4"
                      >

                        <div
                          className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-black ${
                            completed
                              ? "bg-emerald-500 text-black"
                              : active
                              ? "bg-[#FFBE0B] text-black"
                              : "bg-white/10 text-gray-500"
                          }`}
                        >
                          {completed
                            ? "✓"
                            : item.stage}
                        </div>

                        <div>

                          <div className="flex items-center gap-3 flex-wrap">

                            <p
                              className={`font-black text-lg ${
                                completed ||
                                active
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            >
                              {item.title}
                            </p>

                            {completed ? (
                              <span className="text-xs font-black text-emerald-400">
                                COMPLETED
                              </span>
                            ) : active ? (
                              <span className="text-xs font-black text-[#FFBE0B]">
                                CURRENT
                              </span>
                            ) : (
                              <span className="text-xs font-black text-gray-600">
                                PENDING
                              </span>
                            )}

                          </div>

                          <p className="text-sm text-gray-500 mt-1">
                            {item.text}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

            {/* LIVE MAP */}

            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <p className="text-xs uppercase tracking-widest text-[#FFBE0B] font-black">
                Live Tracking
              </p>

              <h2 className="text-3xl font-black mt-2">
                Driver Live Map
              </h2>

              <p className="text-gray-500 mt-2 mb-5">
                Follow your driver from pickup to destination.
              </p>

              <Map
                pickup={pickup}
                drop={destination}
                journeyStage={
                  journeyStage
                }
                journeyProgress={
                  journeyProgress
                }
                driverStartLocation={
                  driverStartLocation
                }
                driverLocation={
                  driverLocation
                }
                rideStatus={
                  currentStatus
                }
              />

            </div>

            {/* CHAT */}

            {chatOpen && (
              <div className="rounded-[2rem] border border-[#FFBE0B]/20 bg-white/[0.035] overflow-hidden">

                <div className="bg-black/30 border-b border-white/10 p-5">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-full bg-[#FFBE0B]/10 flex items-center justify-center text-2xl">
                        👨
                      </div>

                      <div>

                        <p className="font-black text-lg">
                          {selectedDriver?.driver}
                        </p>

                        <p className="text-sm text-emerald-400">
                          ● Online
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setChatOpen(
                          false
                        )
                      }
                      className="w-10 h-10 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
                    >
                      ✕
                    </button>

                  </div>

                </div>

                <div className="h-[350px] overflow-y-auto p-5 space-y-4">

                  {chatMessages.map(
                    (message) => {
                      const isUser =
                        message.sender ===
                        "user";

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={`flex ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              isUser
                                ? "bg-[#FFBE0B] text-black"
                                : "bg-black/30 text-white"
                            }`}
                          >

                            <p className="text-sm font-semibold">
                              {message.text}
                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                <div className="border-t border-white/10 p-4">

                  <div className="flex gap-3">

                    <input
                      type="text"
                      value={
                        chatMessage
                      }
                      onChange={(e) =>
                        setChatMessage(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          sendChatMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#FFBE0B]"
                    />

                    <button
                      type="button"
                      onClick={
                        sendChatMessage
                      }
                      className="w-12 h-12 shrink-0 rounded-xl bg-[#FFBE0B] text-black font-black hover:scale-105 transition"
                    >
                      ➤
                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* RIDE ACTIONS */}

            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <p className="text-xs uppercase tracking-widest text-[#FFBE0B] font-black">
                Ride Actions
              </p>

              <h2 className="text-3xl font-black mt-2">
                Manage Your Ride
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

                <button
                  type="button"
                  onClick={
                    chatWithDriver
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-black hover:border-[#FFBE0B] hover:bg-[#FFBE0B]/10 transition"
                >
                  💬 Chat with Driver
                </button>

                <button
                  type="button"
                  onClick={
                    callDriver
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-black hover:border-emerald-400 hover:bg-emerald-400/10 transition"
                >
                  📞 Call Driver
                </button>

                <button
                  type="button"
                  onClick={
                    cancelRide
                  }
                  className="rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 px-5 py-4 font-black hover:bg-red-500/20 transition"
                >
                  ✕ Cancel Ride
                </button>

              </div>

              <button
                type="button"
                onClick={
                  goToHome
                }
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 font-black hover:border-[#FFBE0B] hover:bg-[#FFBE0B]/10 transition"
              >
                🏠 Back to Home
              </button>

            </div>

          </div>
        )}

      {/* ======================================================
          4-DIGIT RIDE OTP MODAL
      ====================================================== */}

      {showOtpModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111827] shadow-2xl p-6 md:p-8">

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.2em]">
                  Ride Verification
                </p>

                <h2 className="text-2xl md:text-3xl font-black mt-2">
                  Your Ride OTP 🔐
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeOtpModal
                }
                disabled={
                  otpVerifying
                }
                className="w-10 h-10 shrink-0 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
              >
                ✕
              </button>

            </div>

            <p className="text-gray-400 text-sm mt-4 leading-6">
              This is your unique 4-digit ride OTP.
              Give this code to your driver when you meet.
            </p>

            {/* ==================================================
                BIG OTP DISPLAY
            ================================================== */}

            <div className="mt-6 rounded-2xl border-2 border-[#FFBE0B]/40 bg-[#FFBE0B]/10 p-6 text-center">

              <p className="text-xs text-gray-400 uppercase tracking-[0.2em] font-black">
                Your OTP
              </p>

              <p className="text-5xl font-black tracking-[0.4em] text-[#FFBE0B] mt-3 ml-2">
                {rideOtp}
              </p>

              <p className="text-xs text-gray-500 mt-4">
                Give this number to the driver
              </p>

            </div>

            {/* OTP INPUT */}

            <div className="mt-6">

              <label className="text-xs text-gray-500 uppercase tracking-widest font-black">
                Enter OTP to confirm booking
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                autoFocus
                value={
                  otpInput
                }
                onChange={(e) => {
                  setOtpInput(
                    e.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        4
                      )
                  );

                  setOtpError("");
                }}
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    verifyRideOtp();
                  }
                }}
                placeholder="Enter 4-digit OTP"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-5 text-center text-3xl font-black tracking-[0.5em] text-white outline-none focus:border-[#FFBE0B] focus:ring-2 focus:ring-[#FFBE0B]/10"
              />

            </div>

            {/* OTP ERROR */}

            {otpError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
                {otpError}
              </div>
            )}

            {/* VERIFY BUTTON */}

            <button
              type="button"
              onClick={
                verifyRideOtp
              }
              disabled={
                otpVerifying ||
                otpInput.length !== 4
              }
              className={`mt-6 w-full rounded-2xl py-4 font-black text-lg transition ${
                otpVerifying ||
                otpInput.length !== 4
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-[#FFBE0B] text-black hover:scale-[1.01] hover:shadow-xl hover:shadow-[#FFBE0B]/20"
              }`}
            >
              {otpVerifying
                ? "Booking Ride..."
                : "Verify OTP & Book Ride →"}
            </button>

            {/* CANCEL */}

            <button
              type="button"
              onClick={
                closeOtpModal
              }
              disabled={
                otpVerifying
              }
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 py-4 font-black text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
            >
              Cancel
            </button>

            <p className="text-center text-[11px] text-gray-600 mt-5">
              Your unique 4-digit RYDO ride verification code
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

export default BookRide;
