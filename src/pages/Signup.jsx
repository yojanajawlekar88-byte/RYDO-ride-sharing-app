import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
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
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [countdown, setCountdown] = useState(0);

  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
      } catch (err) {
        console.warn("reCAPTCHA cleanup:", err);
      }
    };
  }, []);

  // ============================================================
  // OTP COUNTDOWN
  // ============================================================

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // ============================================================
  // PHONE NORMALIZATION
  // ============================================================

  const normalizePhoneNumber = (value) => {
    let clean = value.trim();

    // Remove spaces, hyphens and brackets
    clean = clean.replace(/[\s\-()]/g, "");

    // Indian number entered as 9876543210
    if (/^[6-9]\d{9}$/.test(clean)) {
      return `+91${clean}`;
    }

    // Indian number entered as 09876543210
    if (/^0[6-9]\d{9}$/.test(clean)) {
      return `+91${clean.substring(1)}`;
    }

    // Already international format
    if (/^\+\d{10,15}$/.test(clean)) {
      return clean;
    }

    return "";
  };

  // ============================================================
  // VALIDATE FORM
  // ============================================================

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!cleanName) {
      setError("Please enter your full name.");
      return false;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return false;
    }

    if (!normalizedPhone) {
      setError(
        "Please enter a valid Indian mobile number, for example 9876543210."
      );
      return false;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  // ============================================================
  // CREATE reCAPTCHA
  // ============================================================

  const createRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "normal",
        callback: () => {
          console.log("reCAPTCHA solved.");
        },
        "expired-callback": () => {
          setError(
            "The reCAPTCHA expired. Please complete it again."
          );
        },
      }
    );

    recaptchaVerifierRef.current = verifier;

    return verifier;
  };

  // ============================================================
  // SEND OTP
  // ============================================================

  const sendOtp = async (isResend = false) => {
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    try {
      if (isResend) {
        setResendingOtp(true);
      } else {
        setSendingOtp(true);
      }

      const verifier = createRecaptcha();

      const confirmationResult =
        await signInWithPhoneNumber(
          auth,
          normalizedPhone,
          verifier
        );

      confirmationResultRef.current =
        confirmationResult;

      setOtpSent(true);
      setOtp("");
      setCountdown(60);

      setSuccess(
        `OTP sent to ${normalizedPhone}. Please check your SMS.`
      );
    } catch (error) {
      console.error("SEND OTP ERROR:", error);

      // Reset reCAPTCHA so it can be rendered again
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }
      } catch (recaptchaError) {
        console.warn(
          "reCAPTCHA reset error:",
          recaptchaError
        );
      }

      recaptchaVerifierRef.current = null;

      switch (error.code) {
        case "auth/invalid-phone-number":
          setError(
            "The phone number is invalid. Enter a valid mobile number."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many OTP requests. Please wait before trying again."
          );
          break;

        case "auth/quota-exceeded":
          setError(
            "Firebase SMS quota has been exceeded. Please try again later."
          );
          break;

        case "auth/captcha-check-failed":
          setError(
            "reCAPTCHA verification failed. Please try again."
          );
          break;

        case "auth/app-not-authorized":
          setError(
            "This domain is not authorized in Firebase Authentication. Add your GitHub Pages domain under Firebase Authentication → Settings → Authorized domains."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Phone Authentication is not enabled in Firebase. Enable Phone sign-in in Firebase Authentication."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            error.message ||
              "Unable to send OTP. Please try again."
          );
      }
    } finally {
      setSendingOtp(false);
      setResendingOtp(false);
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const verifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must contain exactly 6 digits.");
      return;
    }

    if (!confirmationResultRef.current) {
      setError(
        "OTP session expired. Please request a new OTP."
      );
      return;
    }

    try {
      setVerifyingOtp(true);

      await confirmationResultRef.current.confirm(otp);

      setPhoneVerified(true);

      setSuccess(
        "Phone number verified successfully! Creating your RYDO account..."
      );

      // --------------------------------------------------------
      // IMPORTANT
      // --------------------------------------------------------
      // The Firebase phone-auth operation temporarily signs
      // the user in with phone authentication.
      //
      // We immediately create the email/password account below.
      // --------------------------------------------------------

      await createEmailAccount();
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);

      switch (error.code) {
        case "auth/invalid-verification-code":
          setError(
            "Incorrect OTP. Please check the SMS and try again."
          );
          break;

        case "auth/code-expired":
          setError(
            "This OTP has expired. Please request a new OTP."
          );
          break;

        case "auth/session-expired":
          setError(
            "Your OTP session expired. Please request a new OTP."
          );
          break;

        case "auth/credential-already-in-use":
          setError(
            "This phone number is already associated with another account."
          );
          break;

        default:
          setError(
            error.message ||
              "Unable to verify OTP. Please try again."
          );
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ============================================================
  // CREATE EMAIL/PASSWORD ACCOUNT
  // ============================================================

  const createEmailAccount = async () => {
    try {
      setLoading(true);
      setError("");

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = normalizePhoneNumber(phone);

      // --------------------------------------------------------
      // IMPORTANT:
      // Firebase Phone Authentication has already signed in
      // a temporary phone-auth user.
      //
      // We need to sign out before creating the email account
      // to avoid current-user conflicts.
      // --------------------------------------------------------

      await auth.signOut();

      // --------------------------------------------------------
      // CREATE EMAIL/PASSWORD ACCOUNT
      // --------------------------------------------------------

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      // --------------------------------------------------------
      // SAVE DISPLAY NAME
      // --------------------------------------------------------

      await updateProfile(user, {
        displayName: cleanName,
      });

      // --------------------------------------------------------
      // CREATE FIRESTORE USER DOCUMENT
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

          phoneVerified: true,

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
        "RYDO account created successfully! Redirecting..."
      );

      setTimeout(() => {
        navigate("/profile", {
          replace: true,
        });
      }, 1000);
    } catch (error) {
      console.error(
        "CREATE EMAIL ACCOUNT ERROR:",
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

  // ============================================================
  // MAIN BUTTON
  // ============================================================

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // If OTP hasn't been sent yet → send OTP
    if (!otpSent) {
      await sendOtp(false);
      return;
    }

    // If OTP has been sent but isn't verified → verify OTP
    if (!phoneVerified) {
      await verifyOtp();
      return;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

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

                {otpSent
                  ? "Verify Your Phone 📱"
                  : "Create Account 🚗"}

              </h2>

              <p className="text-gray-400 mt-2">

                {otpSent
                  ? "Enter the 6-digit code sent to your mobile."
                  : "Start your journey with RYDO."}

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
                OTP SCREEN
            ================================================== */}

            {otpSent ? (

              <div className="mt-8 space-y-6">

                <div className="text-center">

                  <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-4xl">
                    📱
                  </div>

                  <h3 className="text-xl font-bold mt-5">
                    Verify your mobile number
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    We sent a verification code to
                  </p>

                  <p className="text-[#FFBE0B] font-bold mt-1">
                    {normalizePhoneNumber(phone)}
                  </p>

                </div>

                {/* OTP INPUT */}

                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Enter 6-digit OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(/\D/g, "");

                      setOtp(value);
                      setError("");
                    }}
                    disabled={verifyingOtp || loading}
                    className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-5 text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                  />

                </div>

                {/* VERIFY */}

                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={
                    verifyingOtp ||
                    loading ||
                    otp.length !== 6
                  }
                  className="w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >

                  {verifyingOtp
                    ? "Verifying OTP..."
                    : loading
                    ? "Creating Account..."
                    : "Verify OTP →"}

                </button>

                {/* RESEND */}

                <div className="text-center">

                  {countdown > 0 ? (

                    <p className="text-gray-500 text-sm">
                      Resend OTP in{" "}
                      <span className="text-[#FFBE0B] font-bold">
                        {countdown}s
                      </span>
                    </p>

                  ) : (

                    <button
                      type="button"
                      onClick={() => sendOtp(true)}
                      disabled={resendingOtp}
                      className="text-[#FFBE0B] font-bold hover:underline disabled:opacity-50"
                    >

                      {resendingOtp
                        ? "Sending OTP..."
                        : "Resend OTP"}

                    </button>

                  )}

                </div>

                {/* CHANGE NUMBER */}

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setCountdown(0);
                    setError("");
                    setSuccess("");
                    confirmationResultRef.current = null;

                    try {
                      if (recaptchaVerifierRef.current) {
                        recaptchaVerifierRef.current.clear();
                      }
                    } catch (err) {
                      console.warn(
                        "reCAPTCHA clear:",
                        err
                      );
                    }

                    recaptchaVerifierRef.current = null;
                  }}
                  className="w-full text-gray-400 text-sm hover:text-white transition"
                >
                  ← Change phone number
                </button>

              </div>

            ) : (

              /* =================================================
                 SIGNUP FORM
              ================================================== */

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
                    disabled={loading || sendingOtp}
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
                    disabled={loading || sendingOtp}
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
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError("");
                    }}
                    disabled={loading || sendingOtp}
                    className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    🇮🇳 Enter your 10-digit Indian mobile number.
                  </p>

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
                    disabled={loading || sendingOtp}
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
                    disabled={loading || sendingOtp}
                    className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-[#FFBE0B] transition disabled:opacity-60"
                  />

                </div>

                {/* reCAPTCHA */}

                <div className="flex justify-center pt-2">
                  <div id="recaptcha-container"></div>
                </div>

                {/* SEND OTP */}

                <button
                  type="submit"
                  disabled={
                    sendingOtp ||
                    loading
                  }
                  className="w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >

                  {sendingOtp
                    ? "Sending OTP..."
                    : "Continue with Phone Verification →"}

                </button>

              </form>

            )}

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
