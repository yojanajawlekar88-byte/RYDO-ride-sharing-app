import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#05070D] text-white overflow-hidden">

        {/* =====================================================
            BACKGROUND
        ====================================================== */}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">

          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#FFBE0B]/10 rounded-full blur-[140px]" />

          <div className="absolute top-[35%] -right-40 w-[500px] h-[500px] bg-[#FFBE0B]/10 rounded-full blur-[150px]" />

          <div className="absolute bottom-0 left-[35%] w-[500px] h-[300px] bg-yellow-500/5 rounded-full blur-[130px]" />

        </div>

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative pt-36 pb-20 px-6">

          <div className="max-w-6xl mx-auto text-center">

            {/* Badge */}

            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#FFBE0B]/20 bg-[#FFBE0B]/5">

              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFBE0B] opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFBE0B]"></span>
              </span>

              <span className="text-[#FFBE0B] text-xs font-black tracking-[0.25em] uppercase">
                RYDO Support
              </span>

            </div>

            {/* Heading */}

            <h1 className="mt-8 text-6xl md:text-8xl lg:text-9xl font-black tracking-[-0.05em] leading-[0.9]">

              Let's{" "}

              <span className="text-[#FFBE0B] drop-shadow-[0_0_30px_rgba(255,190,11,0.2)]">
                Talk.
              </span>

            </h1>

            <p className="max-w-2xl mx-auto mt-8 text-gray-400 text-lg md:text-xl leading-relaxed">
              Have a question, need help with a ride, or want to
              share your feedback? Our team is always ready to
              hear from you.
            </p>

            {/* Tagline */}

            <div className="flex justify-center items-center gap-4 mt-8">

              <div className="w-10 h-px bg-[#FFBE0B]/40" />

              <span className="text-[#FFBE0B] font-bold text-sm">
                Tap. Ride. Arrive.
              </span>

              <div className="w-10 h-px bg-[#FFBE0B]/40" />

            </div>

          </div>

        </section>

        {/* =====================================================
            MAIN CONTACT SECTION
        ====================================================== */}

        <section className="relative px-6 pb-24">

          <div className="max-w-7xl mx-auto">

            <div className="grid lg:grid-cols-5 gap-6">

              {/* =================================================
                  LEFT SIDE
              ================================================== */}

              <div className="lg:col-span-2 space-y-6">

                {/* Contact Card */}

                <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.045] backdrop-blur-2xl p-8 md:p-10">

                  {/* Yellow glow */}

                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFBE0B]/10 rounded-full blur-3xl" />

                  <div className="relative">

                    <div className="flex items-center gap-4">

                      <div className="w-14 h-14 rounded-2xl bg-[#FFBE0B] flex items-center justify-center text-black text-2xl font-black shadow-[0_0_35px_rgba(255,190,11,0.2)]">
                        R
                      </div>

                      <div>

                        <p className="text-[#FFBE0B] text-xs font-black tracking-[0.2em] uppercase">
                          Contact
                        </p>

                        <h2 className="text-2xl font-black">
                          RYDO Team
                        </h2>

                      </div>

                    </div>

                    <p className="text-gray-400 leading-relaxed mt-7">
                      We're building a smarter, safer and more
                      connected way to move around your city.
                    </p>

                  </div>

                </div>

                {/* Address */}

                <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/5 transition duration-300">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl group-hover:scale-110 transition">
                      📍
                    </div>

                    <div>

                      <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                        Visit Us
                      </p>

                      <p className="font-bold mt-1">
                        Pune, Maharashtra
                      </p>

                      <p className="text-gray-500 text-sm">
                        India
                      </p>

                    </div>

                  </div>

                </div>

                {/* Phone */}

                <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/5 transition duration-300">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl group-hover:scale-110 transition">
                      📞
                    </div>

                    <div>

                      <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                        Call Us
                      </p>

                      <a
                        href="tel:+918850424753"
                        className="font-bold mt-1 block hover:text-[#FFBE0B] transition"
                      >
                        +91 88504 24753
                      </a>

                      <p className="text-gray-500 text-sm">
                        24 × 7 Support
                      </p>

                    </div>

                  </div>

                </div>

                {/* Email */}

                <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 hover:border-[#FFBE0B]/30 hover:bg-[#FFBE0B]/5 transition duration-300">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-xl group-hover:scale-110 transition">
                      ✉️
                    </div>

                    <div>

                      <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                        Email Us
                      </p>

                      <a
                        href="mailto:support@rydo.com"
                        className="font-bold mt-1 block hover:text-[#FFBE0B] transition"
                      >
                        support@rydo.com
                      </a>

                      <p className="text-gray-500 text-sm">
                        Quick response
                      </p>

                    </div>

                  </div>

                </div>

                {/* Online Support */}

                <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-6">

                  <div className="flex items-center gap-3">

                    <span className="relative flex h-3 w-3">

                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />

                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400" />

                    </span>

                    <div>

                      <p className="font-bold text-green-400">
                        RYDO Support Online
                      </p>

                      <p className="text-gray-500 text-sm mt-1">
                        Usually replies within 10 minutes
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  RIGHT FORM
              ================================================== */}

              <div className="lg:col-span-3">

                <div className="relative h-full rounded-[2rem] border border-white/10 bg-white/[0.045] backdrop-blur-2xl p-7 md:p-10 overflow-hidden">

                  {/* Decorative glow */}

                  <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#FFBE0B]/10 rounded-full blur-[100px]" />

                  <div className="relative">

                    {/* Header */}

                    <div className="flex justify-between items-start gap-5">

                      <div>

                        <p className="text-[#FFBE0B] text-xs font-black tracking-[0.2em] uppercase">
                          Send a message
                        </p>

                        <h2 className="text-3xl md:text-5xl font-black mt-3 leading-tight">
                          How can we{" "}
                          <span className="text-[#FFBE0B]">
                            help?
                          </span>
                        </h2>

                        <p className="text-gray-500 mt-4 max-w-lg">
                          Tell us what you need and we'll take
                          care of the rest.
                        </p>

                      </div>

                      <div className="hidden md:flex w-16 h-16 rounded-2xl bg-[#FFBE0B] text-black items-center justify-center text-2xl shadow-[0_0_40px_rgba(255,190,11,0.15)]">
                        ✦
                      </div>

                    </div>

                    {/* Success Message */}

                    {submitted && (

                      <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            ✓
                          </div>

                          <div>

                            <p className="font-black text-green-400">
                              Message sent successfully!
                            </p>

                            <p className="text-gray-500 text-sm mt-1">
                              Thank you for contacting RYDO.
                            </p>

                          </div>

                        </div>

                      </div>

                    )}

                    {/* Form */}

                    <form
                      onSubmit={handleSubmit}
                      className="relative mt-9 space-y-6"
                    >

                      {/* Name / Email */}

                      <div className="grid md:grid-cols-2 gap-5">

                        <div>

                          <label className="block text-sm font-bold text-gray-300 mb-2">
                            Your Name
                          </label>

                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-600 outline-none transition focus:border-[#FFBE0B]/60 focus:ring-4 focus:ring-[#FFBE0B]/5"
                          />

                        </div>

                        <div>

                          <label className="block text-sm font-bold text-gray-300 mb-2">
                            Email Address
                          </label>

                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-600 outline-none transition focus:border-[#FFBE0B]/60 focus:ring-4 focus:ring-[#FFBE0B]/5"
                          />

                        </div>

                      </div>

                      {/* Subject */}

                      <div>

                        <label className="block text-sm font-bold text-gray-300 mb-2">
                          Subject
                        </label>

                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What is this about?"
                          required
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-600 outline-none transition focus:border-[#FFBE0B]/60 focus:ring-4 focus:ring-[#FFBE0B]/5"
                        />

                      </div>

                      {/* Message */}

                      <div>

                        <div className="flex justify-between items-center mb-2">

                          <label className="block text-sm font-bold text-gray-300">
                            Your Message
                          </label>

                          <span className="text-xs text-gray-600">
                            {formData.message.length}/500
                          </span>

                        </div>

                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              handleChange(e);
                            }
                          }}
                          placeholder="Write your message..."
                          rows="7"
                          required
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-gray-600 outline-none resize-none transition focus:border-[#FFBE0B]/60 focus:ring-4 focus:ring-[#FFBE0B]/5"
                        />

                      </div>

                      {/* Button */}

                      <button
                        type="submit"
                        className="group w-full bg-[#FFBE0B] text-black py-5 rounded-xl font-black text-lg transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,190,11,0.2)] active:translate-y-0"
                      >

                        <span className="flex items-center justify-center gap-3">

                          Send Message

                          <span className="text-xl group-hover:translate-x-2 transition-transform">
                            →
                          </span>

                        </span>

                      </button>

                      <p className="text-center text-gray-600 text-xs">
                        🔒 Your information is safe and secure with RYDO.
                      </p>

                    </form>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            BOTTOM FEATURES
        ====================================================== */}

        <section className="relative px-6 pb-24">

          <div className="max-w-7xl mx-auto">

            <div className="grid md:grid-cols-3 gap-5">

              {/* Card 1 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-7 hover:border-[#FFBE0B]/30 hover:-translate-y-1 transition duration-300">

                <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  ⚡
                </div>

                <h3 className="text-xl font-black mt-5">
                  Fast Support
                </h3>

                <p className="text-gray-500 mt-2 leading-relaxed">
                  Get quick assistance whenever you need it.
                </p>

              </div>

              {/* Card 2 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-7 hover:border-[#FFBE0B]/30 hover:-translate-y-1 transition duration-300">

                <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🔒
                </div>

                <h3 className="text-xl font-black mt-5">
                  Your Privacy
                </h3>

                <p className="text-gray-500 mt-2 leading-relaxed">
                  Your personal information remains protected.
                </p>

              </div>

              {/* Card 3 */}

              <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-7 hover:border-[#FFBE0B]/30 hover:-translate-y-1 transition duration-300">

                <div className="w-12 h-12 rounded-xl bg-[#FFBE0B]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  💛
                </div>

                <h3 className="text-xl font-black mt-5">
                  We're With You
                </h3>

                <p className="text-gray-500 mt-2 leading-relaxed">
                  From your first ride to every ride after.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}

export default Contact;
