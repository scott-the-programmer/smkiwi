import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-custom-blue text-white p-4 mt-8">
      <div className="container flex justify-between max-w-none">
        <div className="flex space-x-4">
          <a
            href="https://github.com/scott-the-programmer"
            target="_blank"
            rel="noreferrer"
            className="text-lg"
          >
            <img
              className="h-5 w-5 mx-2"
              src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg"
            />
          </a>
          <a
            href="https://twitter.com/ScottProgrammer"
            target="_blank"
            rel="noreferrer"
            className="text-lg"
          >
            <img
              className="h-5 w-5 mx-2"
              src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/twitter.svg"
            />
          </a>
          <a
            href="https://linkedin.com/in/scottalexandermurray"
            target="_blank"
            rel="noreferrer"
            className="text-lg"
          >
            <img
              className="h-5 w-5 mx-2"
              src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg"
            />
          </a>
          <a
            href="https://instagram.com/shxppingtrxllxy"
            target="_blank"
            rel="noreferrer"
            className="text-lg"
          >
            <img
              className="h-5 w-5 mx-2"
              src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/instagram.svg"
            />
          </a>
        </div>
        <p className="text-sm">Scott Murray</p>
      </div>
    </footer>
  );
};

export default Footer;
