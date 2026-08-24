import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import BookRide from "./pages/BookRide";
import ParcelDelivery from "./pages/ParcelDelivery";
import ParcelStatus from "./pages/ParcelStatus";

function App() {
  return (
    <BrowserRouter basename="/RYDO-ride-sharing-app">
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* RIDE */}
        <Route
          path="/bookride"
          element={<BookRide />}
        />

        {/* PARCEL DELIVERY */}
        <Route
          path="/parcel-delivery"
          element={<ParcelDelivery />}
        />

        {/* PARCEL STATUS */}
        <Route
          path="/parcel-status/:id"
          element={<ParcelStatus />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
