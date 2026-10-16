import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Tour from "../components/landing/Tour";
import Footer from "../components/landing/Footer";
import { Connected, FinalCta, ForTheGroup, Numbers, SecuritySection } from "../components/landing/Sections";
import "../styles/landing.css";

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Connected />
        <Tour />
        <Numbers />
        <ForTheGroup />
        <SecuritySection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
