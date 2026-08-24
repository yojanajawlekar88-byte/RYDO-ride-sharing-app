import { Routes, Route, Navigate } from "react-router-dom";

// ==========================================
// PAGES
// ==========================================

import Home from "./pages/Home";
import BookRide from "./pages/BookRide";
import ParcelDelivery from "./pages/ParcelDelivery";
import ParcelStatus from "./pages/ParcelStatus";
import Login from "./pages/Login";
import LearnMore from "./pages/LearnMore";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import DriverDashboard from "./pages/DriverDashboard";
import RideHistory from "./pages/RideHistory";
import RideDetails from "./pages/RideDetails";

function App() {
  return (
    <Routes>

      {/* HOME */}
      <Route path="/" element={<Home />} />

      {/* AUTHENTICATION */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* RIDE BOOKING */}
      <Route path="/bookride" element={<BookRide />} />

      {/* RIDE HISTORY */}
      <Route path="/ride-history" element={<RideHistory />} />
      <Route path="/ridehistory" element={<RideHistory />} />

      {/* RIDE DETAILS */}
      <Route
        path="/ride-details/:rideId"
        element={<RideDetails />}
      />

      {/* PARCEL DELIVERY */}
      <Route
        path="/parcel-delivery"
        element={<ParcelDelivery />}
      />

      <Route
        path="/parceldelivery"
        element={
          <Navigate
            to="/parcel-delivery"
            replace
          />
        }
      />

      {/* PARCEL STATUS */}
      <Route
        path="/parcel-status/:parcelId"
        element={<ParcelStatus />}
      />

      {/* OTHER PAGES */}
      <Route
        path="/learn-more"
        element={<LearnMore />}
      />

      <Route
        path="/features"
        element={<Features />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/contact"
        element={<Contact />}
      />

      {/* USER PAGES */}
      <Route
        path="/wallet"
        element={<Wallet />}
      />

      <Route
        path="/profile"
        element={<Profile />}
      />

      <Route
        path="/driver-dashboard"
        element={<DriverDashboard />}
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default App;
