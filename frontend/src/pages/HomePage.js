import React from "react";
import "../styles/HomePage.css";

function HomePage() {
    return (
        <main className="haiji-home">
            <section className="hero">
                <div className="hero-content">
                    <h1>
                        <span>Learn Japanese</span>
                        <span>the elegant way.</span>
                    </h1>

                    <p className="hero-subtitle">
                        Practice kana, track progress, improve every day.
                    </p>

                    <button className="hero-cta">
                        Start Learning
                    </button>
                </div>

                {/* Este div sólo sirve para el background del Fuji */}
                <div className="hero-visual" aria-hidden="true" />
            </section>
        </main>
    );
}

export default HomePage;
