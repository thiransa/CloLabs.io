import React, { useState } from "react";
import styles from "./LandingHero.module.css";
import logo from "../../assets/17F007DC-F981-4891-AED4-6F81382D4181.PNG";

const navLinks = [
  { id: "home", label: "Home", active: true },
  { id: "challenge", label: "Challenge" },
  { id: "fix", label: "Fix" },
  { id: "features", label: "Features" },
  { id: "action", label: "Action" },
  { id: "pricing", label: "Pricing" }
];

const LandingNavbar = ({ onNavAction = () => {}, onNavSelect = () => {} }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggle = () => setMenuOpen((prev) => !prev);

  return (
    <header className={styles.navbar}>
      <div className={styles.navLogo} aria-label="CloLabs logo">
        <img src={logo} alt="CloLabs" loading="lazy" />
      </div>

      <div className={styles.navCenter}>
        <ul className={styles.navList} role="menubar" aria-label="Primary landing navigation">
          {navLinks.map((link) => (
            <li key={link.id} role="none">
              <button
                type="button"
                className={`${styles.navButton} ${link.active ? styles.navButtonActive : ""}`}
                role="menuitem"
                onClick={() => onNavSelect(link.id)}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div
          id="landing-nav-mobile"
          className={`${styles.navMobileSheet} ${menuOpen ? styles.navMobileSheetOpen : ""}`}
          role="menu"
          aria-label="Mobile landing navigation"
        >
          {navLinks.map((link) => (
            <button
              key={`${link.id}-mobile`}
              type="button"
              className={`${styles.navButton} ${link.active ? styles.navButtonActive : ""}`}
              onClick={() => {
                onNavSelect(link.id);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.navActions}>
        <button
          type="button"
          className={styles.navSignIn}
          aria-label="Open login modal"
          onClick={onNavAction}
        >
          Log In
        </button>
        <button
          type="button"
          className={styles.navHamburger}
          aria-label="Toggle landing navigation"
          aria-controls="landing-nav-mobile"
          aria-expanded={menuOpen}
          onClick={handleToggle}
        >
          <span />
        </button>
      </div>
    </header>
  );
};

export default LandingNavbar;
