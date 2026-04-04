import React from "react";
import Header from "../components/Header";
import EmotionCategoriesSection from "../components/EmotionCategoriesSection";
import FeaturedMusic from "../components/FeaturedMusic";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import MusicGeneratorSection from "../components/MusicGeneratorSection";
import MusicNewsLetterSection from "../components/MusicNewsLetterSection";
const Home = () => (
  <>
  <Header/>
  <HeroSection/>
  <FeaturedMusic/>
  <EmotionCategoriesSection />
  <MusicGeneratorSection/>
  <MusicNewsLetterSection/>
  <Footer/>
  </>
);

export default Home;
