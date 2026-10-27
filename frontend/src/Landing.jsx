import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import travel1 from "./assets/landing/travel-1.jpg";
import travel2 from "./assets/landing/travel-2.jpg";
import travel3 from "./assets/landing/travel-3.jpg";
import travel4 from "./assets/landing/travel-4.jpg";

import "./Landing.css";

const heroImages = [travel1, travel2, travel3, travel4];

function Landing() {
  const [heroImage] = useState(
    () => heroImages[Math.floor(Math.random() * heroImages.length)]
  );

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon">
            <Compass size={23} />
          </span>
          <span>Wayfarer</span>
        </Link>

        <nav className="landing-nav">
          <Link to="/login" className="landing-nav-login">
            Sign in
          </Link>
          <Link to="/register" className="landing-nav-register">
            Get started <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-eyebrow">
              <Sparkles size={15} />
              <span>YOUR NEXT ADVENTURE STARTS HERE</span>
            </div>

            <h1>
              The world is waiting.
              <span> Find your way.</span>
            </h1>

            <p className="landing-hero-description">
              Discover incredible destinations, explore new experiences, and
              plan journeys that turn your travel dreams into reality.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="landing-primary-button">
                Start your journey <ArrowRight size={17} />
              </Link>

              <Link to="/destinations" className="landing-secondary-button">
                Explore Wayfarer
              </Link>
            </div>

            <div className="landing-travel-note">
              <MapPin size={17} />
              <span>Your next unforgettable destination is out there.</span>
            </div>
          </div>

          <div className="landing-hero-visual">
            <img
              src={heroImage}
              alt="Beautiful travel destination"
              className="landing-hero-image"
            />

            <div className="landing-image-caption">
              <span className="landing-caption-icon">
                <MapPin size={20} />
              </span>
              <div>
                <span className="landing-caption-label">THE WORLD IS YOURS</span>
                <p>Discover somewhere extraordinary.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-portal-section">
          <div className="landing-section-heading">
            <span>EXPLORE WAYFARER</span>
            <h2>Where would you like to go?</h2>
            <p>Everything you need to make your next journey happen.</p>
          </div>

          <div className="landing-portal-grid">
            <article className="landing-portal-card">
              <div className="landing-portal-icon traveller-icon">
                <Compass size={25} />
              </div>

              <span className="landing-card-label">FOR TRAVELLERS</span>
              <h3>Your next story begins here.</h3>
              <p>
                Discover destinations, find places that match your interests,
                and plan a journey that's yours.
              </p>

              <Link to="/register" className="landing-portal-link">
                Start exploring <ArrowRight size={17} />
              </Link>
            </article>

            <article className="landing-portal-card">
              <div className="landing-portal-icon admin-icon">
                <ShieldCheck size={25} />
              </div>

              <span className="landing-card-label">FOR ADMINISTRATORS</span>
              <h3>Manage the journey.</h3>
              <p>
                Manage destinations and keep the travel experience organised
                for every explorer.
              </p>

              <Link to="/admin" className="landing-portal-link">
                Admin portal <ArrowRight size={17} />
              </Link>
            </article>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="landing-footer-brand">
          <Compass size={17} />
          <span>Wayfarer</span>
        </Link>
        <p>Made for the journeys worth remembering.</p>
      </footer>
    </div>
  );
}

export default Landing;