/*
 README — LandingHero tuning notes
 1. Adjust glow intensity via the CSS custom properties at the top of LandingHero.module.css or tweak blur on `.gradientLayer`.
 2. Move or resize mirrored tunnels by editing `.gradientTop`, `.gradientBottom`, `.gradientAmbientLeft`, and `.gradientAmbientRight` positions.
 3. The vertical streak height/opacities live in `.verticalStreak*`; lower opacity for calmer motion or shorten height for smaller screens.
*/

import React from "react";
import styles from "./LandingHero.module.css";
import LandingNavbar from "./LandingNavbar";

const noop = () => {};

const partnerBrands = ["Vercel", "Loom", "Cash App", "Loops", "Zapier", "Ramp", "Raycast"];

const LandingHero = ({
  onPrimaryAction = noop,
  onSecondaryAction = noop,
  onNavAction = noop,
  onNavSelect = noop
}) => {
  return (
    <section className={styles.heroOuter} role="region" aria-label="Landing hero">
      <div className={styles.heroCard}>
        <LandingNavbar onNavAction={onNavAction} onNavSelect={onNavSelect} />

        <div className={styles.heroScene} aria-hidden="true">
          <span className={`${styles.gradientLayer} ${styles.gradientTop}`} />
          <span className={`${styles.gradientLayer} ${styles.gradientBottom}`} />
          <span className={`${styles.gradientLayer} ${styles.gradientCore}`} />
          <span className={`${styles.gradientLayer} ${styles.gradientAmbientLeft}`} />
          <span className={`${styles.gradientLayer} ${styles.gradientAmbientRight}`} />

          <div className={styles.curveLine}>
            <svg viewBox="0 0 1200 500" preserveAspectRatio="none">
              <path
                d="M40 150 C 300 60, 900 220, 1160 90"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M60 360 C 400 420, 800 260, 1140 370"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
                fill="none"
                strokeDasharray="6 6"
              />
            </svg>
          </div>

          <span className={`${styles.verticalStreak} ${styles.verticalStreakOne}`} />
          <span className={`${styles.verticalStreak} ${styles.verticalStreakTwo}`} />
          <span className={`${styles.verticalStreak} ${styles.verticalStreakThree}`} />

        </div>

        <button type="button" className={styles.playTrigger} aria-label="Play product demo">
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path d="M9 7l8 5-8 5V7z" />
          </svg>
          Unlock Your Automation Spark!
        </button>

        <div className={styles.heroContent}>
          <p className={styles.heroBadge}> • Clolabs •</p>
          <h1 className={styles.heroTitle}>
            Three Clicks for <span className={styles.heroTitleAccent}>effortless Automations</span>
          </h1>
          <p className={styles.heroSubtext}>
            Turn repetitive tasks into instant smooth workflows <br/> and save time effortlessly every single day.
          </p>
          <div className={styles.heroCtas}>
            <button
              type="button"
              className={styles.ctaPrimary}
              aria-label="Get started with CloLabs"
              onClick={onPrimaryAction}
            >
              Get Started
            </button>
            <button
              type="button"
              className={styles.ctaSecondary}
              aria-label="Discover CloLabs explore page"
              onClick={onSecondaryAction}
            >
              Discover
            </button>
          </div>
        </div>

        <div className={styles.partnerRow}>
          {partnerBrands.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
