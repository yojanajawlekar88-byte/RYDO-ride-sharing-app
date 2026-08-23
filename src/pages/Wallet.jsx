import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  WalletCards,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Home,
  CarFront,
  User,
  Gift,
  Headphones,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  Building2,
  ChevronRight,
  CircleCheck,
} from "lucide-react";

import {
  auth,
  db,
} from "../firebase";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore";


// ============================================================
// HELPER FUNCTIONS
// ============================================================

const getSafeNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[₹,\s]/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
  }

  return 0;
};


const getDateValue = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  return new Date().toISOString();
};


// ============================================================
// CARD NUMBER FORMATTER
// ============================================================

const formatCardNumber = (value) => {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 16);

  return numbers
    .replace(/(.{4})/g, "$1 ")
    .trim();
};


// ============================================================
// EXPIRY FORMATTER
// ============================================================

const formatExpiry = (value) => {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 4);

  if (numbers.length <= 2) {
    return numbers;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
};


// ============================================================
// WALLET COMPONENT
// ============================================================

function Wallet() {
  const navigate = useNavigate();


  // ==========================================================
  // AUTH
  // ==========================================================

  const [currentUser, setCurrentUser] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);


  // ==========================================================
  // WALLET
  // ==========================================================

  const [walletLoading, setWalletLoading] =
    useState(true);

  const [balance, setBalance] =
    useState(0);

  const [transactions, setTransactions] =
    useState([]);


  // ==========================================================
  // RIDES
  // ==========================================================

  const [userRides, setUserRides] =
    useState([]);

  const [ridesLoading, setRidesLoading] =
    useState(true);


  // ==========================================================
  // ADD MONEY
  // ==========================================================

  const [selectedAmount, setSelectedAmount] =
    useState(null);

  const [showAddMoney, setShowAddMoney] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);


  // ==========================================================
  // PAYMENT METHOD
  // ==========================================================

  const [paymentMethod, setPaymentMethod] =
    useState("UPI");


  // ==========================================================
  // PAYMENT FORM
  // ==========================================================

  const [upiId, setUpiId] =
    useState("");

  const [cardName, setCardName] =
    useState("");

  const [cardNumber, setCardNumber] =
    useState("");

  const [cardExpiry, setCardExpiry] =
    useState("");

  const [cardCvv, setCardCvv] =
    useState("");

  const [bankName, setBankName] =
    useState("");

  const [accountHolder, setAccountHolder] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [ifsc, setIfsc] =
    useState("");


  // ==========================================================
  // PAYMENT SUCCESS
  // ==========================================================

  const [paymentSuccess, setPaymentSuccess] =
    useState(false);

  const [paymentReference, setPaymentReference] =
    useState("");


  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [successMessage, setSuccessMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================================
  // PAYMENT PROCESSING
  // ==========================================================

  const reconciliationRunning =
    useRef(false);


  // ==========================================================
  // AMOUNT OPTIONS
  // ==========================================================

  const addMoneyOptions = [
    100,
    200,
    500,
    1000,
  ];


  // ==========================================================
  // BANK OPTIONS
  // ==========================================================

  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bank of Maharashtra",
    "Punjab National Bank",
    "Bank of Baroda",
  ];


  // ==========================================================
  // AUTH LISTENER
  // ==========================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setAuthLoading(false);
        },
        (authError) => {
          console.error(
            "Authentication error:",
            authError
          );

          setCurrentUser(null);
          setAuthLoading(false);

          setError(
            "Unable to check login status."
          );
        }
      );

    return () => unsubscribe();
  }, []);


  // ==========================================================
  // LOAD USER WALLET
  // ==========================================================

  useEffect(() => {
    if (!currentUser) {
      setBalance(0);
      setTransactions([]);
      setWalletLoading(false);

      return undefined;
    }

    setWalletLoading(true);
    setError("");

    const userRef =
      doc(
        db,
        "users",
        currentUser.uid
      );

    const unsubscribe =
      onSnapshot(
        userRef,
        (snapshot) => {
          try {
            if (!snapshot.exists()) {
              setBalance(0);
              setTransactions([]);
              setWalletLoading(false);

              return;
            }

            const data =
              snapshot.data();

            const firebaseBalance =
              getSafeNumber(
                data.wallet
              );

            const firebaseTransactions =
              Array.isArray(
                data.transactions
              )
                ? data.transactions
                : [];

            setBalance(
              Math.max(
                0,
                firebaseBalance
              )
            );

            setTransactions(
              firebaseTransactions
            );

            setWalletLoading(false);

          } catch (walletProcessingError) {
            console.error(
              "Wallet processing error:",
              walletProcessingError
            );

            setWalletLoading(false);

            setError(
              "Unable to load wallet data."
            );
          }
        },
        (walletError) => {
          console.error(
            "Wallet listener error:",
            walletError
          );

          setWalletLoading(false);

          if (
            walletError.code ===
            "permission-denied"
          ) {
            setError(
              "Firebase permission denied. Check your Firestore Rules."
            );
          } else {
            setError(
              "Unable to load your wallet."
            );
          }
        }
      );

    return () => unsubscribe();
  }, [currentUser]);


  // ==========================================================
  // REAL-TIME RIDE LISTENER
  // ==========================================================

  useEffect(() => {
    if (!currentUser) {
      setUserRides([]);
      setRidesLoading(false);

      return undefined;
    }

    setRidesLoading(true);

    const ridesQuery =
      query(
        collection(db, "rides"),
        where(
          "userId",
          "==",
          currentUser.uid
        )
      );

    const unsubscribe =
      onSnapshot(
        ridesQuery,
        (snapshot) => {
          const rides =
            snapshot.docs.map(
              (rideDocument) => ({
                id: rideDocument.id,
                ...rideDocument.data(),
              })
            );

          setUserRides(rides);
          setRidesLoading(false);
        },
        (rideError) => {
          console.error(
            "Ride listener error:",
            rideError
          );

          setRidesLoading(false);

          if (
            rideError.code ===
            "permission-denied"
          ) {
            setError(
              "Firebase permission denied while reading rides."
            );
          }
        }
      );

    return () => unsubscribe();
  }, [currentUser]);


  // ==========================================================
  // AUTOMATIC WALLET PAYMENT RECONCILIATION
  // ==========================================================

  useEffect(() => {
    if (
      !currentUser ||
      userRides.length === 0
    ) {
      return undefined;
    }

    if (
      reconciliationRunning.current
    ) {
      return undefined;
    }

    let cancelled = false;

    const reconcileWalletPayments =
      async () => {
        reconciliationRunning.current =
          true;

        try {
          const walletRides =
            userRides.filter(
              (ride) => {
                if (
                  ride.walletDeducted ===
                  true
                ) {
                  return false;
                }

                const paymentMethod =
                  String(
                    ride.paymentMethod ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                const isWalletPayment =
                  paymentMethod ===
                    "rydo wallet" ||
                  paymentMethod ===
                    "wallet";

                const paymentStatus =
                  String(
                    ride.paymentStatus ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                const isPaid =
                  paymentStatus ===
                    "paid" ||
                  paymentStatus ===
                    "completed";

                const fare =
                  getSafeNumber(
                    ride.paidAmount ??
                      ride.fare ??
                      ride.amount ??
                      ride.price ??
                      0
                  );

                return (
                  isWalletPayment &&
                  isPaid &&
                  fare > 0
                );
              }
            );

          if (
            walletRides.length === 0
          ) {
            return;
          }

          for (
            const ride of walletRides
          ) {
            if (cancelled) {
              break;
            }

            try {
              const userRef =
                doc(
                  db,
                  "users",
                  currentUser.uid
                );

              const rideRef =
                doc(
                  db,
                  "rides",
                  ride.id
                );

              await runTransaction(
                db,
                async (transaction) => {
                  const userSnapshot =
                    await transaction.get(
                      userRef
                    );

                  const rideSnapshot =
                    await transaction.get(
                      rideRef
                    );

                  if (
                    !userSnapshot.exists()
                  ) {
                    throw new Error(
                      "User wallet document does not exist."
                    );
                  }

                  if (
                    !rideSnapshot.exists()
                  ) {
                    return;
                  }

                  const userData =
                    userSnapshot.data();

                  const freshRide =
                    rideSnapshot.data();

                  if (
                    freshRide.walletDeducted ===
                    true
                  ) {
                    return;
                  }

                  const paymentMethod =
                    String(
                      freshRide.paymentMethod ||
                        ""
                    )
                      .trim()
                      .toLowerCase();

                  const isWalletPayment =
                    paymentMethod ===
                      "rydo wallet" ||
                    paymentMethod ===
                      "wallet";

                  if (
                    !isWalletPayment
                  ) {
                    return;
                  }

                  const paymentStatus =
                    String(
                      freshRide.paymentStatus ||
                        ""
                    )
                      .trim()
                      .toLowerCase();

                  const isPaid =
                    paymentStatus ===
                      "paid" ||
                    paymentStatus ===
                      "completed";

                  if (!isPaid) {
                    return;
                  }

                  const fare =
                    getSafeNumber(
                      freshRide.paidAmount ??
                        freshRide.fare ??
                        freshRide.amount ??
                        freshRide.price ??
                        0
                    );

                  if (fare <= 0) {
                    return;
                  }

                  const currentBalance =
                    getSafeNumber(
                      userData.wallet
                    );

                  const safeBalance =
                    Math.max(
                      0,
                      currentBalance
                    );

                  if (
                    safeBalance < fare
                  ) {
                    console.warn(
                      `Insufficient wallet balance for ride ${ride.id}`
                    );

                    return;
                  }

                  const newBalance =
                    safeBalance - fare;

                  const existingTransactions =
                    Array.isArray(
                      userData.transactions
                    )
                      ? userData.transactions
                      : [];

                  const alreadyRecorded =
                    existingTransactions.some(
                      (item) =>
                        String(
                          item.rideId ||
                            ""
                        ) ===
                        String(
                          ride.id
                        )
                    );

                  if (
                    alreadyRecorded
                  ) {
                    transaction.update(
                      rideRef,
                      {
                        walletDeducted:
                          true,

                        walletDeductedAt:
                          new Date().toISOString(),
                      }
                    );

                    return;
                  }

                  const walletTransaction =
                    {
                      id:
                        `RIDE-${ride.id}`,

                      rideId:
                        ride.id,

                      title:
                        "Ride Payment",

                      description:
                        `Payment for RYDO ride ${
                          freshRide.rideId ||
                          ride.id
                        }`,

                      amount:
                        fare,

                      type:
                        "Debit",

                      status:
                        "Completed",

                      paymentMethod:
                        "RYDO Wallet",

                      date:
                        getDateValue(
                          freshRide.paidAt ||
                            freshRide.createdAt
                        ),
                    };

                  transaction.set(
                    userRef,
                    {
                      wallet:
                        newBalance,

                      transactions:
                        arrayUnion(
                          walletTransaction
                        ),

                      updatedAt:
                        new Date().toISOString(),
                    },
                    {
                      merge: true,
                    }
                  );

                  transaction.update(
                    rideRef,
                    {
                      walletDeducted:
                        true,

                      walletDeductedAt:
                        new Date().toISOString(),

                      walletAmountDeducted:
                        fare,

                      walletBalanceAfter:
                        newBalance,
                    }
                  );
                }
              );

              if (!cancelled) {
                setSuccessMessage(
                  `₹${getSafeNumber(
                    ride.paidAmount ??
                      ride.fare ??
                      ride.amount ??
                      ride.price ??
                      0
                  )} deducted from your RYDO Wallet.`
                );

                setError("");
              }

            } catch (ridePaymentError) {
              console.error(
                `Wallet payment failed for ride ${ride.id}:`,
                ridePaymentError
              );

              if (
                ridePaymentError.code ===
                "permission-denied"
              ) {
                setError(
                  "Firebase permission denied. Check your Firestore Rules."
                );
              }
            }
          }

        } catch (reconcileError) {
          console.error(
            "Wallet reconciliation error:",
            reconcileError
          );

          if (!cancelled) {
            setError(
              "Unable to process wallet ride payment."
            );
          }

        } finally {
          reconciliationRunning.current =
            false;
        }
      };

    reconcileWalletPayments();

    return () => {
      cancelled = true;
    };

  }, [
    currentUser,
    userRides,
  ]);


  // ==========================================================
  // NORMALIZE TRANSACTIONS
  // ==========================================================

  const normalizedTransactions =
    useMemo(() => {
      return transactions
        .map(
          (
            transaction,
            index
          ) => {
            const rawAmount =
              getSafeNumber(
                transaction.amount
              );

            const type =
              String(
                transaction.type ||
                  ""
              ).toLowerCase();

            const description =
              String(
                transaction.description ||
                  ""
              ).toLowerCase();

            const title =
              String(
                transaction.title ||
                  ""
              ).toLowerCase();

            const isDebit =
              type.includes(
                "debit"
              ) ||
              description.includes(
                "ride payment"
              ) ||
              title.includes(
                "ride payment"
              );

            const displayAmount =
              isDebit
                ? -Math.abs(
                    rawAmount
                  )
                : Math.abs(
                    rawAmount
                  );

            return {
              ...transaction,

              id:
                transaction.id ||
                transaction.rideId ||
                `TXN-${index}`,

              title:
                transaction.title ||
                (
                  isDebit
                    ? "Ride Payment"
                    : "Money Added"
                ),

              description:
                transaction.description ||
                "Wallet transaction",

              date:
                getDateValue(
                  transaction.date ||
                    transaction.createdAt
                ),

              amount:
                displayAmount,

              isDebit,

              status:
                transaction.status ||
                "Completed",
            };
          }
        )
        .reverse();

    }, [transactions]);


  // ==========================================================
  // TOTAL MONEY ADDED
  // ==========================================================

  const totalAdded =
    useMemo(() => {
      return normalizedTransactions
        .filter(
          (transaction) =>
            transaction.amount > 0
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            transaction.amount,
          0
        );

    }, [
      normalizedTransactions,
    ]);


  // ==========================================================
  // TOTAL RIDE SPENDING
  // ==========================================================

  const rideSpending =
    useMemo(() => {
      return normalizedTransactions
        .filter(
          (transaction) =>
            transaction.amount < 0
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            Math.abs(
              transaction.amount
            ),
          0
        );

    }, [
      normalizedTransactions,
    ]);


  // ==========================================================
  // WALLET RIDES COUNT
  // ==========================================================

  const walletRideCount =
    useMemo(() => {
      return userRides.filter(
        (ride) => {
          const method =
            String(
              ride.paymentMethod ||
                ""
            )
              .trim()
              .toLowerCase();

          return (
            method ===
              "rydo wallet" ||
            method ===
              "wallet"
          );
        }
      ).length;

    }, [userRides]);


  // ==========================================================
  // RESET PAYMENT FORM
  // ==========================================================

  const resetPaymentForm = () => {
    setUpiId("");

    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");

    setBankName("");
    setAccountHolder("");
    setAccountNumber("");
    setIfsc("");

    setPaymentMethod("UPI");

    setSelectedAmount(null);

    setPaymentSuccess(false);
    setPaymentReference("");

    setError("");
    setSuccessMessage("");
  };


  // ==========================================================
  // CLOSE PAYMENT
  // ==========================================================

  const closePayment = () => {
    if (actionLoading) {
      return;
    }

    setShowAddMoney(false);

    resetPaymentForm();
  };


  // ==========================================================
  // VALIDATE PAYMENT
  // ==========================================================

  const validatePaymentForm = () => {
    if (!selectedAmount) {
      return "Please select an amount.";
    }

    if (paymentMethod === "UPI") {
      if (!upiId.trim()) {
        return "Please enter your UPI ID.";
      }

      const upiPattern =
        /^[\w.-]+@[\w.-]+$/;

      if (
        !upiPattern.test(
          upiId.trim()
        )
      ) {
        return "Please enter a valid UPI ID, for example name@upi.";
      }
    }


    if (paymentMethod === "CARD") {
      if (!cardName.trim()) {
        return "Please enter the cardholder name.";
      }

      const cleanCardNumber =
        cardNumber.replace(
          /\s/g,
          ""
        );

      if (
        cleanCardNumber.length !==
        16
      ) {
        return "Card number must contain 16 digits.";
      }

      if (
        cardExpiry.length !== 5
      ) {
        return "Please enter a valid expiry date.";
      }

      if (
        cardCvv.length !== 3
      ) {
        return "CVV must contain 3 digits.";
      }
    }


    if (
      paymentMethod ===
      "NETBANKING"
    ) {
      if (!bankName) {
        return "Please select your bank.";
      }

      if (
        !accountHolder.trim()
      ) {
        return "Please enter the account holder name.";
      }

      if (accountNumber.length !== 16) {
  return "Account number must contain exactly 16 digits.";
}
      if (
        ifsc.trim().length !==
        11
      ) {
        return "Please enter a valid 11-character IFSC code.";
      }
    }

    return "";
  };


  // ==========================================================
  // ADD MONEY / DEMO PAYMENT
  // ==========================================================

  const handleAddMoney =
    async () => {
      const validationError =
        validatePaymentForm();

      if (validationError) {
        setError(
          validationError
        );

        return;
      }

      if (!currentUser) {
        setError(
          "Please login before adding money."
        );

        return;
      }

      const amount =
        getSafeNumber(
          selectedAmount
        );

      if (amount <= 0) {
        setError(
          "Invalid amount."
        );

        return;
      }

      try {
        setActionLoading(true);

        setError("");
        setSuccessMessage("");

        // ----------------------------------------------------
        // SIMULATED PAYMENT PROCESSING
        // ----------------------------------------------------

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              1600
            )
        );


        const userRef =
          doc(
            db,
            "users",
            currentUser.uid
          );

        const now =
          new Date().toISOString();

        const reference =
          `RYDO${Date.now()
            .toString()
            .slice(-8)}`;


        // ----------------------------------------------------
        // SAFE PAYMENT METHOD LABEL
        //
        // Do NOT store card number,
        // CVV, account number or passwords.
        // ----------------------------------------------------

        let paymentMethodLabel =
          "UPI";

        if (
          paymentMethod ===
          "CARD"
        ) {
          paymentMethodLabel =
            "Card";
        }

        if (
          paymentMethod ===
          "NETBANKING"
        ) {
          paymentMethodLabel =
            "Net Banking";
        }


        await runTransaction(
          db,
          async (transaction) => {
            const userSnapshot =
              await transaction.get(
                userRef
              );

            const existingData =
              userSnapshot.exists()
                ? userSnapshot.data()
                : {};

            const currentBalance =
              getSafeNumber(
                existingData.wallet
              );

            const safeBalance =
              Math.max(
                0,
                currentBalance
              );


            const newTransaction =
              {
                id:
                  `ADD-${Date.now()}`,

                title:
                  "Money Added",

                description:
                  `Wallet top-up via ${paymentMethodLabel}`,

                amount:
                  amount,

                type:
                  "Credit",

                status:
                  "Completed",

                paymentMethod:
                  paymentMethodLabel,

                paymentReference:
                  reference,

                date:
                  now,
              };


            transaction.set(
              userRef,
              {
                wallet:
                  safeBalance +
                  amount,

                transactions:
                  arrayUnion(
                    newTransaction
                  ),

                updatedAt:
                  now,
              },
              {
                merge: true,
              }
            );
          }
        );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        setPaymentReference(
          reference
        );

        setPaymentSuccess(
          true
        );

        setSuccessMessage(
          `₹${amount} added successfully!`
        );

      } catch (walletError) {
        console.error(
          "Add money error:",
          walletError
        );

        if (
          walletError.code ===
          "permission-denied"
        ) {
          setError(
            "Firebase permission denied. Check your Firestore Rules."
          );
        } else {
          setError(
            walletError.message ||
              "Unable to complete payment."
          );
        }

      } finally {
        setActionLoading(false);
      }
    };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        navigate(
          "/login"
        );

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


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070B16] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFBE0B] flex items-center justify-center text-black text-2xl font-black animate-pulse">
            R
          </div>

          <p className="mt-5 text-gray-400">
            Loading your RYDO wallet...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // LOGIN REQUIRED
  // ==========================================================

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070B16] text-white flex items-center justify-center px-6">

        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-10 text-center shadow-2xl">

          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFBE0B] flex items-center justify-center text-black text-4xl font-black">
            R
          </div>

          <p className="text-[#FFBE0B] text-xs font-black tracking-[0.3em] mt-7">
            RYDO WALLET
          </p>

          <h1 className="text-4xl md:text-5xl font-black mt-3">
            Login to access your wallet.
          </h1>

          <p className="text-gray-400 mt-4">
            Sign in to manage your balance,
            add money and view ride payments.
          </p>

          <Link
            to="/login"
            className="inline-flex mt-8 w-full items-center justify-center rounded-2xl bg-[#FFBE0B] py-4 font-black text-black hover:scale-[1.02] transition"
          >
            Continue to RYDO →
          </Link>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN WALLET
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#070B16] text-white">


      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070B16]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="text-4xl font-black tracking-tight text-[#FFBE0B]"
          >
            RYDO
          </Link>


          <div className="hidden items-center gap-8 lg:flex">

            <Link
              to="/"
              className="nav-link"
            >
              Home
            </Link>

            <Link
              to="/bookride"
              className="nav-link"
            >
              Book Ride
            </Link>

            <Link
              to="/features"
              className="nav-link"
            >
              Features
            </Link>

            <Link
              to="/about"
              className="nav-link"
            >
              About
            </Link>

            <Link
              to="/contact"
              className="nav-link"
            >
              Contact
            </Link>

            <Link
              to="/wallet"
              className="wallet-link"
            >
              Wallet
            </Link>

            <Link
              to="/profile"
              className="nav-link"
            >
              Profile
            </Link>

            <Link
              to="/ride-history"
              className="nav-link"
            >
              Ride History
            </Link>

          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-red-500/80 px-6 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>

        </div>

      </nav>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="relative mx-auto max-w-[1250px] px-6 py-12 overflow-hidden">

        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#FFBE0B]/10 blur-[140px]" />


        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="relative mb-10 text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFBE0B]/20 bg-[#FFBE0B]/10 px-5 py-2 text-sm font-bold text-[#FFBE0B]">

            <WalletCards size={17} />

            RYDO WALLET

          </div>


          <h1 className="text-5xl font-black tracking-tight md:text-6xl">
            Your Wallet 💳
          </h1>


          <p className="mt-4 text-lg text-gray-400">
            Manage your balance and ride payments in one place.
          </p>

        </section>


        {/* ==================================================
            SUCCESS
        ================================================== */}

        {successMessage && (
          <div className="mb-6 flex justify-center">

            <div className="flex items-center gap-3 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-3 text-sm font-bold text-green-400">

              <CheckCircle size={19} />

              {successMessage}

            </div>

          </div>
        )}


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-semibold text-red-400">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <span>
              {error}
            </span>

          </div>
        )}


        {/* ==================================================
            BALANCE CARD
        ================================================== */}

        <section className="relative mb-8 overflow-hidden rounded-[32px] border border-[#FFBE0B]/30 bg-gradient-to-br from-[#FFBE0B] via-[#FFC928] to-[#FFE477] p-8 text-black shadow-[0_20px_70px_rgba(255,190,11,0.18)] md:p-10">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/30 blur-3xl" />

          <div className="relative">

            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10">

                    <WalletCards
                      size={27}
                    />

                  </div>

                  <p className="text-sm font-black uppercase tracking-wider">
                    Available Balance
                  </p>

                </div>


                <h2 className="mt-5 text-6xl font-black tracking-tight md:text-7xl">

                  {walletLoading
                    ? "₹—"
                    : `₹${balance.toFixed(2)}`}

                </h2>


                <p className="mt-3 font-medium text-black/60">
                  Use your wallet balance for faster ride payments.
                </p>

              </div>


              <div className="flex items-center gap-3 rounded-full bg-black/10 px-5 py-3">

                <span className="h-3 w-3 animate-pulse rounded-full bg-green-600" />

                <span className="text-sm font-black">
                  Wallet Active
                </span>

              </div>

            </div>


            <div className="mt-10 flex flex-col justify-between gap-5 border-t border-black/10 pt-6 sm:flex-row sm:items-center">

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-black/50">
                  RYDO WALLET
                </p>

                <p className="mt-1 font-black">
                  Secure digital payments
                </p>

              </div>


              <div className="flex items-center gap-2 text-sm font-bold">

                <ShieldCheck size={18} />

                Secure Payments

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            STATS
        ================================================== */}

        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-[#FFBE0B]/30 transition">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Money Added
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  ₹{totalAdded.toFixed(0)}
                </h3>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-400">

                <ArrowDownLeft
                  size={25}
                />

              </div>

            </div>

          </div>


          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-[#FFBE0B]/30 transition">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Ride Spending
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  ₹{rideSpending.toFixed(0)}
                </h3>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">

                <ArrowUpRight
                  size={25}
                />

              </div>

            </div>

          </div>


          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-[#FFBE0B]/30 transition">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-400">
                  Transactions
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  {normalizedTransactions.length}
                </h3>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                <History
                  size={25}
                />

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            WALLET PAYMENT STATUS
        ================================================== */}

        <section className="mb-8 rounded-3xl border border-[#FFBE0B]/20 bg-[#111827] p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                <RefreshCw
                  size={22}
                />

              </div>

              <div>

                <h3 className="font-black">
                  Automatic Wallet Payments
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  RYDO automatically detects wallet-paid rides.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-3">

              <span className="rounded-full bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400">
                LIVE
              </span>

              <span className="text-sm text-gray-400">
                {walletRideCount} wallet ride
                {walletRideCount !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

          </div>

        </section>


        {/* ==================================================
            ADD MONEY
        ================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-[#111827]">

          <div className="p-7 md:p-9">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                  <Plus size={25} />

                </div>

                <div>

                  <h2 className="text-2xl font-black">
                    Add Money
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Securely top up your RYDO wallet.
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={() => {
                  setShowAddMoney(true);
                  setError("");
                  setSuccessMessage("");
                  setPaymentSuccess(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FFBE0B] px-6 py-3 font-black text-black transition hover:scale-105"
              >

                <Plus size={18} />

                Add Money

              </button>

            </div>

          </div>


          {/* PAYMENT METHODS DISPLAY */}

          <div className="border-t border-white/10 bg-[#0D1422] px-7 py-6">

            <p className="mb-4 text-sm font-bold text-gray-400">
              Available Payment Methods
            </p>


            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="payment-preview">

                <Smartphone
                  className="text-[#FFBE0B]"
                  size={22}
                />

                <div>
                  <span className="font-bold">
                    UPI
                  </span>

                  <p className="text-xs text-gray-500">
                    Fast & convenient
                  </p>
                </div>

              </div>


              <div className="payment-preview">

                <CreditCard
                  className="text-[#FFBE0B]"
                  size={22}
                />

                <div>
                  <span className="font-bold">
                    Card
                  </span>

                  <p className="text-xs text-gray-500">
                    Debit / Credit Card
                  </p>
                </div>

              </div>


              <div className="payment-preview">

                <Banknote
                  className="text-[#FFBE0B]"
                  size={22}
                />

                <div>
                  <span className="font-bold">
                    Net Banking
                  </span>

                  <p className="text-xs text-gray-500">
                    All major banks
                  </p>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            TRANSACTION HISTORY
        ================================================== */}

        <section className="mb-10">

          <div className="mb-6">

            <div className="flex items-center gap-3">

              <History
                size={27}
                className="text-[#FFBE0B]"
              />

              <h2 className="text-3xl font-black">
                Transaction History
              </h2>

            </div>


            <p className="mt-2 text-sm text-gray-500">
              Live wallet activity from Firebase.
            </p>

          </div>


          {walletLoading ? (

            <div className="rounded-3xl border border-white/10 bg-[#111827] p-10 text-center text-gray-400">

              <Loader2
                className="mx-auto animate-spin text-[#FFBE0B]"
                size={30}
              />

              <p className="mt-4">
                Loading transactions...
              </p>

            </div>

          ) : normalizedTransactions.length === 0 ? (

            <div className="rounded-3xl border border-white/10 bg-[#111827] p-10 text-center">

              <WalletCards
                className="mx-auto text-[#FFBE0B]"
                size={45}
              />

              <h3 className="mt-4 text-2xl font-black">
                No transactions yet
              </h3>

              <p className="mt-2 text-gray-500">
                Add money or pay for a ride to see activity here.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {normalizedTransactions.map(
                (transaction) => (

                  <div
                    key={
                      transaction.id
                    }
                    className="group flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#111827] p-5 transition hover:border-[#FFBE0B]/20 hover:bg-[#141D2D] md:flex-row md:items-center md:justify-between md:p-6"
                  >

                    <div className="flex items-center gap-4">

                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                          transaction.amount >
                          0
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >

                        {transaction.amount >
                        0 ? (

                          <ArrowDownLeft
                            size={26}
                          />

                        ) : (

                          <CarFront
                            size={25}
                          />

                        )}

                      </div>


                      <div>

                        <h3 className="font-black">
                          {
                            transaction.title
                          }
                        </h3>


                        <p className="mt-1 text-sm text-gray-500">

                          {transaction.rideId
                            ? `Ride ID: ${transaction.rideId}`
                            : transaction.description}

                        </p>


                        <p className="mt-1 text-xs text-gray-600">
                          {transaction.date}
                        </p>

                      </div>

                    </div>


                    <div className="flex items-center justify-between gap-5 md:justify-end">

                      <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400">

                        <CheckCircle
                          size={14}
                        />

                        {
                          transaction.status
                        }

                      </div>


                      <div
                        className={`text-xl font-black ${
                          transaction.amount >
                          0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >

                        {transaction.amount >
                        0
                          ? "+"
                          : "-"}

                        ₹

                        {Math.abs(
                          transaction.amount
                        ).toFixed(0)}

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ==================================================
            BENEFITS
        ================================================== */}

        <section className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">

            <ShieldCheck
              size={28}
              className="text-[#FFBE0B]"
            />

            <h3 className="mt-4 text-lg font-black">
              Secure Payments
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Payment details are processed only for this demo payment and sensitive information is not saved.
            </p>

          </div>


          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">

            <ArrowUpRight
              size={28}
              className="text-[#FFBE0B]"
            />

            <h3 className="mt-4 text-lg font-black">
              Instant Ride Payment
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Pay rides directly from your RYDO wallet.
            </p>

          </div>


          <div className="rounded-3xl border border-white/10 bg-[#111827] p-6">

            <Gift
              size={28}
              className="text-[#FFBE0B]"
            />

            <h3 className="mt-4 text-lg font-black">
              Easy Top-Up
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Add ₹100, ₹200, ₹500 or ₹1000 using your preferred payment method.
            </p>

          </div>

        </section>


        {/* ==================================================
            QUICK LINKS
        ================================================== */}

        <section className="mb-10 rounded-3xl border border-white/10 bg-[#111827] p-6">

          <h2 className="mb-5 text-xl font-black">
            Quick Links
          </h2>


          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

            <Link
              to="/"
              className="quick-link"
            >

              <Home
                size={20}
                className="text-[#FFBE0B]"
              />

              Home

            </Link>


            <Link
              to="/bookride"
              className="quick-link"
            >

              <CarFront
                size={20}
                className="text-[#FFBE0B]"
              />

              Book Ride

            </Link>


            <Link
              to="/profile"
              className="quick-link"
            >

              <User
                size={20}
                className="text-[#FFBE0B]"
              />

              Profile

            </Link>


            <Link
              to="/ride-history"
              className="quick-link"
            >

              <History
                size={20}
                className="text-[#FFBE0B]"
              />

              Rides

            </Link>


            <Link
              to="/contact"
              className="quick-link"
            >

              <Headphones
                size={20}
                className="text-[#FFBE0B]"
              />

              Help

            </Link>

          </div>

        </section>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="border-t border-white/10 py-10 text-center">

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">

            <span className="font-black text-[#FFBE0B]">
              RYDO
            </span>

            <span>
              © 2026 RYDO. Ride Smarter.
            </span>

          </div>


          <p className="mt-2 text-xs text-gray-600">
            Tap. Ride. Arrive.
          </p>

        </footer>

      </main>


      {/* ======================================================
          PREMIUM PAYMENT MODAL
      ====================================================== */}

      {showAddMoney && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">

          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#0D1422] shadow-[0_30px_100px_rgba(0,0,0,0.6)]">


            {/* ==================================================
                CLOSE
            ================================================== */}

            <button
              type="button"
              onClick={
                closePayment
              }
              disabled={
                actionLoading
              }
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >

              <X size={20} />

            </button>


            {!paymentSuccess ? (

              <>


                {/* ==================================================
                    PAYMENT HEADER
                ================================================== */}

                <div className="border-b border-white/10 bg-gradient-to-br from-[#FFBE0B]/15 to-transparent p-7 md:p-9">

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFBE0B] text-black shadow-lg shadow-[#FFBE0B]/20">

                      <WalletCards
                        size={28}
                      />

                    </div>

                    <div>

                      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FFBE0B]">
                        RYDO SECURE PAY
                      </p>

                      <h2 className="mt-1 text-3xl font-black">
                        Add Money
                      </h2>

                    </div>

                  </div>


                  <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#FFBE0B]/20 bg-[#FFBE0B]/5 p-5">

                    <div>

                      <p className="text-sm text-gray-400">
                        Amount
                      </p>

                      <p className="mt-1 text-3xl font-black text-[#FFBE0B]">

                        ₹
                        {selectedAmount ||
                          "0"}

                      </p>

                    </div>


                    <div className="flex items-center gap-2 text-xs font-bold text-green-400">

                      <Lock
                        size={15}
                      />

                      Secure Checkout

                    </div>

                  </div>

                </div>


                {/* ==================================================
                    PAYMENT CONTENT
                ================================================== */}

                <div className="p-7 md:p-9">


                  {/* ==================================================
                      STEP 1 - AMOUNT
                  ================================================== */}

                  <div>

                    <div className="mb-4 flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFBE0B] text-sm font-black text-black">
                        1
                      </span>

                      <h3 className="font-black">
                        Select Amount
                      </h3>

                    </div>


                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                      {addMoneyOptions.map(
                        (amount) => (

                          <button
                            key={amount}
                            type="button"
                            onClick={() =>
                              setSelectedAmount(
                                amount
                              )
                            }
                            className={`rounded-2xl border px-4 py-4 font-black transition ${
                              selectedAmount ===
                              amount
                                ? "border-[#FFBE0B] bg-[#FFBE0B] text-black shadow-lg shadow-[#FFBE0B]/10"
                                : "border-white/10 bg-[#151E2E] text-white hover:border-[#FFBE0B]/40"
                            }`}
                          >

                            ₹
                            {amount}

                          </button>

                        )
                      )}

                    </div>

                  </div>


                  {/* ==================================================
                      STEP 2 - PAYMENT METHOD
                  ================================================== */}

                  <div className="mt-8">

                    <div className="mb-4 flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFBE0B] text-sm font-black text-black">
                        2
                      </span>

                      <h3 className="font-black">
                        Choose Payment Method
                      </h3>

                    </div>


                    <div className="grid grid-cols-3 gap-3">

                      {/* UPI */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "UPI"
                          )
                        }
                        className={`payment-method ${
                          paymentMethod ===
                          "UPI"
                            ? "payment-method-active"
                            : ""
                        }`}
                      >

                        <Smartphone
                          size={23}
                        />

                        <span>
                          UPI
                        </span>

                        {paymentMethod ===
                          "UPI" && (
                          <CircleCheck
                            size={17}
                            className="absolute right-2 top-2"
                          />
                        )}

                      </button>


                      {/* CARD */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "CARD"
                          )
                        }
                        className={`payment-method ${
                          paymentMethod ===
                          "CARD"
                            ? "payment-method-active"
                            : ""
                        }`}
                      >

                        <CreditCard
                          size={23}
                        />

                        <span>
                          Card
                        </span>

                        {paymentMethod ===
                          "CARD" && (
                          <CircleCheck
                            size={17}
                            className="absolute right-2 top-2"
                          />
                        )}

                      </button>


                      {/* NET BANKING */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "NETBANKING"
                          )
                        }
                        className={`payment-method ${
                          paymentMethod ===
                          "NETBANKING"
                            ? "payment-method-active"
                            : ""
                        }`}
                      >

                        <Banknote
                          size={23}
                        />

                        <span>
                          Net Banking
                        </span>

                        {paymentMethod ===
                          "NETBANKING" && (
                          <CircleCheck
                            size={17}
                            className="absolute right-2 top-2"
                          />
                        )}

                      </button>

                    </div>

                  </div>


                  {/* ==================================================
                      STEP 3 - PAYMENT DETAILS
                  ================================================== */}

                  <div className="mt-8">

                    <div className="mb-4 flex items-center gap-3">

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFBE0B] text-sm font-black text-black">
                        3
                      </span>

                      <h3 className="font-black">
                        Enter Payment Details
                      </h3>

                    </div>


                    {/* ==================================================
                        UPI FORM
                    ================================================== */}

                    {paymentMethod ===
                      "UPI" && (

                      <div className="payment-form-card">

                        <div className="mb-5 flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                            <Smartphone
                              size={22}
                            />

                          </div>

                          <div>

                            <h4 className="font-black">
                              UPI Payment
                            </h4>

                            <p className="text-xs text-gray-500">
                              Enter your UPI ID
                            </p>

                          </div>

                        </div>


                        <label className="input-label">
                          UPI ID
                        </label>

                        <input
                          type="text"
                          value={upiId}
                          onChange={(event) =>
                            setUpiId(
                              event.target.value
                            )
                          }
                          placeholder="example@upi"
                          className="premium-input"
                        />


                        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-xs text-green-400">

                          ✓ Your UPI ID is used only for this demo payment.

                        </div>

                      </div>

                    )}


                    {/* ==================================================
                        CARD FORM
                    ================================================== */}

                    {paymentMethod ===
                      "CARD" && (

                      <div className="payment-form-card">

                        <div className="mb-5 flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                            <CreditCard
                              size={22}
                            />

                          </div>

                          <div>

                            <h4 className="font-black">
                              Card Payment
                            </h4>

                            <p className="text-xs text-gray-500">
                              Debit or credit card
                            </p>

                          </div>

                        </div>


                        <div>

                          <label className="input-label">
                            Cardholder Name
                          </label>

                          <input
                            type="text"
                            value={
                              cardName
                            }
                            onChange={(event) =>
                              setCardName(
                                event.target.value
                              )
                            }
                            placeholder="Enter cardholder name"
                            className="premium-input"
                          />

                        </div>


                        <div className="mt-5">

                          <label className="input-label">
                            Card Number
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              cardNumber
                            }
                            onChange={(event) =>
                              setCardNumber(
                                formatCardNumber(
                                  event.target.value
                                )
                              )
                            }
                            placeholder="1234 5678 9012 3456"
                            className="premium-input"
                          />

                        </div>


                        <div className="mt-5 grid grid-cols-2 gap-4">

                          <div>

                            <label className="input-label">
                              Expiry Date
                            </label>

                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                cardExpiry
                              }
                              onChange={(event) =>
                                setCardExpiry(
                                  formatExpiry(
                                    event.target.value
                                  )
                                )
                              }
                              placeholder="MM/YY"
                              className="premium-input"
                            />

                          </div>


                          <div>

                            <label className="input-label">
                              CVV
                            </label>

                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={3}
                              value={
                                cardCvv
                              }
                              onChange={(event) =>
                                setCardCvv(
                                  event.target.value.replace(
                                    /\D/g,
                                    ""
                                  )
                                )
                              }
                              placeholder="•••"
                              className="premium-input"
                            />

                          </div>

                        </div>


                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400">

                          <ShieldCheck
                            size={16}
                            className="mt-0.5 shrink-0"
                          />

                          <span>
                            For this college demo, card information is processed temporarily and is not saved to Firebase.
                          </span>

                        </div>

                      </div>

                    )}


                    {/* ==================================================
                        NET BANKING FORM
                    ================================================== */}

                    {paymentMethod ===
                      "NETBANKING" && (

                      <div className="payment-form-card">

                        <div className="mb-5 flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFBE0B]/10 text-[#FFBE0B]">

                            <Building2
                              size={22}
                            />

                          </div>

                          <div>

                            <h4 className="font-black">
                              Net Banking
                            </h4>

                            <p className="text-xs text-gray-500">
                              Enter your banking details
                            </p>

                          </div>

                        </div>


                        <div>

                          <label className="input-label">
                            Select Bank
                          </label>

                          <select
                            value={
                              bankName
                            }
                            onChange={(event) =>
                              setBankName(
                                event.target.value
                              )
                            }
                            className="premium-input"
                          >

                            <option
                              value=""
                              className="bg-[#111827]"
                            >
                              Select your bank
                            </option>

                            {banks.map(
                              (bank) => (

                                <option
                                  key={bank}
                                  value={bank}
                                  className="bg-[#111827]"
                                >
                                  {bank}
                                </option>

                              )
                            )}

                          </select>

                        </div>


                        <div className="mt-5">

                          <label className="input-label">
                            Account Holder Name
                          </label>

                          <input
                            type="text"
                            value={
                              accountHolder
                            }
                            onChange={(event) =>
                              setAccountHolder(
                                event.target.value
                              )
                            }
                            placeholder="Enter account holder name"
                            className="premium-input"
                          />

                        </div>


                        <div className="mt-5">

                          <label className="input-label">
                            Account Number
                          </label>

                          <input
  type="password"
  inputMode="numeric"
  maxLength={16}
  value={accountNumber}
  onChange={(event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 16);

    setAccountNumber(value);
  }}
  placeholder="Enter 16 digit account number"
  className="premium-input"
/>

<p className="mt-2 text-xs text-gray-500">
  {accountNumber.length}/16 digits
</p>

                        </div>


                        <div className="mt-5">

                          <label className="input-label">
                            IFSC Code
                          </label>

                          <input
                            type="text"
                            maxLength={11}
                            value={
                              ifsc
                            }
                            onChange={(event) =>
                              setIfsc(
                                event.target.value
                                  .toUpperCase()
                                  .replace(
                                    /[^A-Z0-9]/g,
                                    ""
                                  )
                              )
                            }
                            placeholder="SBIN0001234"
                            className="premium-input"
                          />

                        </div>


                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-400">

                          <ShieldCheck
                            size={16}
                            className="mt-0.5 shrink-0"
                          />

                          <span>
                            Never enter your banking password, PIN or OTP in this demo application.
                          </span>

                        </div>

                      </div>

                    )}

                  </div>


                  {/* ==================================================
                      PAYMENT BUTTON
                  ================================================== */}

                  <button
                    type="button"
                    onClick={
                      handleAddMoney
                    }
                    disabled={
                      actionLoading ||
                      !selectedAmount
                    }
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FFBE0B] py-4 text-lg font-black text-black shadow-xl shadow-[#FFBE0B]/10 transition hover:-translate-y-0.5 hover:shadow-[#FFBE0B]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {actionLoading ? (

                      <>
                        <Loader2
                          size={21}
                          className="animate-spin"
                        />

                        Processing Payment...

                      </>

                    ) : (

                      <>
                        <Lock
                          size={19}
                        />

                        Pay ₹
                        {selectedAmount ||
                          "0"}

                        <ChevronRight
                          size={19}
                        />

                      </>

                    )}

                  </button>


                  <p className="mt-4 text-center text-xs text-gray-600">

                    🔒 Demo payment • Sensitive payment credentials are not stored

                  </p>

                </div>

              </>

            ) : (

              /* ==================================================
                  PAYMENT SUCCESS
              ================================================== */

              <div className="p-8 text-center md:p-12">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-400">

                  <CheckCircle
                    size={58}
                  />

                </div>


                <p className="mt-7 text-xs font-black uppercase tracking-[0.3em] text-green-400">
                  Payment Successful
                </p>


                <h2 className="mt-3 text-4xl font-black">
                  Money Added!
                </h2>


                <p className="mt-4 text-gray-400">
                  Your RYDO Wallet has been successfully credited.
                </p>


                <div className="mx-auto mt-8 max-w-md rounded-3xl border border-green-500/20 bg-green-500/5 p-7">

                  <p className="text-sm text-gray-500">
                    Amount Added
                  </p>

                  <p className="mt-2 text-5xl font-black text-green-400">
                    ₹
                    {selectedAmount}
                  </p>


                  <div className="mt-6 border-t border-white/10 pt-5">

                    <div className="flex items-center justify-between text-sm">

                      <span className="text-gray-500">
                        Payment Method
                      </span>

                      <span className="font-bold">
                        {paymentMethod ===
                        "UPI"
                          ? "UPI"
                          : paymentMethod ===
                            "CARD"
                          ? "Card"
                          : "Net Banking"}
                      </span>

                    </div>


                    <div className="mt-3 flex items-center justify-between text-sm">

                      <span className="text-gray-500">
                        Reference
                      </span>

                      <span className="font-bold text-[#FFBE0B]">
                        {paymentReference}
                      </span>

                    </div>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={() => {
                    setShowAddMoney(
                      false
                    );

                    resetPaymentForm();
                  }}
                  className="mt-8 w-full rounded-2xl bg-[#FFBE0B] py-4 font-black text-black transition hover:scale-[1.02]"
                >
                  Done
                </button>


                <p className="mt-4 text-xs text-gray-600">
                  Your new wallet balance will appear automatically.
                </p>

              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          STYLES
      ====================================================== */}

      <style>{`

        .nav-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #d1d5db;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #FFBE0B;
        }


        .wallet-link {
          position: relative;
          font-size: 0.875rem;
          font-weight: 700;
          color: #FFBE0B;
        }

        .wallet-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -20px;
          height: 4px;
          border-radius: 999px;
          background: #FFBE0B;
          box-shadow:
            0 0 15px
            rgba(255,190,11,0.7);
        }


        .quick-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.05);
          background: #151E2E;
          padding: 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }


        .quick-link:hover {
          border-color:
            rgba(255,190,11,0.3);

          background: #1A2435;

          transform:
            translateY(-2px);
        }


        .payment-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.05);
          background: #151E2E;
          padding: 1rem;
        }


        .payment-method {
          position: relative;
          display: flex;
          min-height: 95px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.08);
          background: #151E2E;
          color: #9ca3af;
          font-size: 0.8rem;
          font-weight: 800;
          transition: all 0.2s ease;
        }


        .payment-method:hover {
          border-color:
            rgba(255,190,11,0.4);

          color: white;

          transform:
            translateY(-2px);
        }


        .payment-method-active {
          border-color:
            #FFBE0B;

          background:
            rgba(255,190,11,0.10);

          color:
            #FFBE0B;

          box-shadow:
            0 0 25px
            rgba(255,190,11,0.08);
        }


        .payment-form-card {
          border-radius: 1.5rem;
          border: 1px solid
            rgba(255,255,255,0.08);
          background:
            #111827;
          padding: 1.5rem;
        }


        .input-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          color: #9ca3af;
        }


        .premium-input {
          width: 100%;
          border-radius: 0.9rem;
          border: 1px solid
            rgba(255,255,255,0.10);
          background: #151E2E;
          padding: 0.9rem 1rem;
          color: white;
          outline: none;
          transition: all 0.2s ease;
        }


        .premium-input::placeholder {
          color: #4b5563;
        }


        .premium-input:focus {
          border-color:
            #FFBE0B;

          box-shadow:
            0 0 0 3px
            rgba(255,190,11,0.08);
        }


        select.premium-input {
          cursor: pointer;
        }

      `}</style>

    </div>
  );
}


export default Wallet;