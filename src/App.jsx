import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import MusicPage from "./pages/MusicPage";
import MusicDetails from "./pages/MusicDetails"
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />{" "}
        <Route path="/musics" element={<MusicPage/>}/>
        <Route path="/musics/:id" element={<MusicDetails/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/sign-up" element={<SignUp/>}/>
        <Route path ="/log-in" element ={<LogIn/>}/>
      </Routes>
    </Router>
  );
}
