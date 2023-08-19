import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-custom-blue p-4 text-white">
      <div className="container flex justify-between max-w-none">
        <Link to="/" className="text-2xl font-semibold">
          Scott Murray
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link to="/" className="text-lg" data-testid="NonMobileHome">
            Home
          </Link>
          <Link to="/blog" className="text-lg" data-testid="NonMobileBlog">
            Blog
          </Link>
          <Link to="/dog" className="text-lg" data-testid="NonMobileDog">
            Dog
          </Link>
        </div>
        <div
          className="md:hidden cursor-pointer"
          data-testid="MobileMenuButton"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col space-y-1">
            <span className="w-6 h-1 bg-white"></span>
            <span className="w-6 h-1 bg-white"></span>
            <span className="w-6 h-1 bg-white"></span>
          </div>
        </div>
      </div>
      <div
        data-testid="MobileMenu"
        className={`transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden flex flex-col space-y-2 mt-4 bg-custom-blue fixed top-0 left-0 h-full w-64 p-4 z-50`}
      >
        <Link
          to="/"
          className="text-lg"
          data-testid="MobileHome"
          onClick={() => setIsOpen(false)}
        >
          Home
        </Link>
        <Link
          to="/blog"
          className="text-lg"
          data-testid="MobileBlog"
          onClick={() => setIsOpen(false)}
        >
          Blog
        </Link>
        <Link
          to="/dog"
          className="text-lg"
          data-testid="MobileDog"
          onClick={() => setIsOpen(false)}
        >
          Blog
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
