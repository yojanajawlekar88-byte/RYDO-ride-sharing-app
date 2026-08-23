import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Payment() {

  const navigate = useNavigate();

  const handlePayment = () => {
    alert("Payment Successful!");
    navigate("/ridehistory");
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#0B1020] text-white pt-28 pb-20 px-6">

        <div className="max-w-xl mx-auto bg-[#1E293B] p-8 rounded-3xl shadow-xl">

          <h1 className="text-4xl font-bold text-[#FFBE0B] mb-6">
            Payment
          </h1>

          <p className="mb-6">
            Select your payment method.
          </p>

          <div className="space-y-4">

            <button className="w-full bg-white text-black py-4 rounded-xl font-bold">
              💳 Credit / Debit Card
            </button>

            <button className="w-full bg-white text-black py-4 rounded-xl font-bold">
              📱 UPI
            </button>

            <button className="w-full bg-white text-black py-4 rounded-xl font-bold">
              💵 Cash
            </button>

          </div>

          <button
            onClick={handlePayment}
            className="mt-8 w-full bg-[#FFBE0B] text-black py-4 rounded-xl font-bold hover:scale-105 transition"
          >
            Pay Now
          </button>

        </div>

      </div>

      <Footer />
    </>
  );
}

export default Payment;