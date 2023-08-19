import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Hero";
import Footer from "./components/Footer";
import Blog from "./components/Blog";
import Dog from "./components/Dog";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/dog" element={<Dog />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
