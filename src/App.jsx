import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import MusicPage from "./pages/MusicPage";
import MusicDetails from "./pages/MusicDetails"
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import AddEditMusic from "./pages/AddEditMusic";
import FavoriteMusics from "./pages/FavoriteMusics";
import PrivacyPolicy from "./pages/PrivacyPolicy";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />{" "}
        <Route path="/musics" element={<MusicPage/>}/>
        <Route path="/musics/:id" element={<MusicDetails/>}/>
        <Route path ="/add" element={<AddEditMusic/>}/>
        <Route path ="/favorites" element={<FavoriteMusics/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/sign-up" element={<SignUp/>}/>
        <Route path ="/log-in" element ={<LogIn/>}/>
        <Route path ="/privacy" element ={<PrivacyPolicy/>}/>
      </Routes>
    </Router>
  );
}
