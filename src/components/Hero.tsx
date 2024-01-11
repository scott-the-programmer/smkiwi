import "./Hero.css";
import GraphToggle from "./GraphToggle";
import Timeline from "./Timeline";
import PlantPot from "./PlantPot";
import SatelliteMap from "./SatelliteMap";

export default function Home() {
  return (
    <div>
      <div id="home" className="hero-bg w-screen">
        <div className="cloud cloud0"></div>
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>
        <div className="cloud cloud4"></div>
        <div className="cloud cloud5"></div>
        <div className="absolute bg-svg-last overflow-divider"></div>
        <div className="z-10 relative">

        <SatelliteMap/>
          <div
            className="
            w-3/5
            m-auto
            justify-start
            text-blog-text
          "
          >
            <h1
              className="
          text-center text-nav-bar-yellow text-5xl pt-20 lg:text-7xl
        "
            >
              Cloud Whisperer
            </h1>

            <p className="m-auto pt-5 text-justify lg:text-lg lg:w-96">
              Experienced <del>bug</del>{" "}
              <b>
                <em>clean code</em>
              </b>{" "}
              typer who resides in Auckland, New Zealand. Actively purchasing
              video games that I will never play.
            </p>
            <p className="pt-5 m-auto text-center lg:text-lg lg:w-96">
              <b>I'm mainly involved in ☁️ cloud and deploying code 🚀 </b>
            </p>
          </div>
        </div>
      </div>

      <GraphToggle />
      <Timeline />
      <PlantPot />
    </div>
  );
}
