import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import WhyChoose from "../components/WhyChoose";
import HowItWorks from "../components/HowItWorks";
import PopularDestinations from "../components/PopularDestinations";
import Features from "../components/Features";
import RideShowcase from "../components/RideShowcase";
import Testimonials from "../components/Testimonials";
import DownloadApp from "../components/DownloadApp";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <WhyChoose />

      <HowItWorks />

      <PopularDestinations />

      <Features />

      <RideShowcase />

      <Testimonials />

      <DownloadApp />

      <Footer />
    </>
  );
}

export default Home;
