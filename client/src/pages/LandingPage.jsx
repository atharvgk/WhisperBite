import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, Brain, Calendar, CloudSun, BarChart3, Shield } from 'lucide-react';
import './LandingPage.css';

const features = [
    { icon: Mic, title: 'Voice Booking', desc: 'Just speak — our AI listens, understands, and books for you.' },
    { icon: Brain, title: 'Smart AI Agent', desc: 'Powered by LLaMA 3 with intelligent slot-filling and memory.' },
    { icon: Calendar, title: 'Real-Time Availability', desc: 'Instant availability checks with alternative slot suggestions.' },
    { icon: CloudSun, title: 'Weather-Aware', desc: 'Automatic seating recommendations based on weather forecasts.' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Admin insights on peak hours, cuisine trends, and more.' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'JWT auth, rate limiting, and robust error handling.' },
];

export default function LandingPage() {
    return (
        <div className="landing">
            {/* Hero */}
            <section className="hero">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.span
                        className="hero-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        ✨ AI-Powered Reservations
                    </motion.span>

                    <h1 className="hero-title">
                        Reserve Your Table<br />
                        <span className="gradient-text">With Just Your Voice</span>
                    </h1>

                    <p className="hero-subtitle">
                        WhisperBite is an intelligent restaurant reservation assistant.
                        Simply speak or type to book — our AI handles the rest.
                    </p>

                    <div className="hero-actions">
                        <Link to="/book" className="btn-primary">
                            <Mic size={18} />
                            Start Booking
                        </Link>
                        <a href="#features" className="btn-secondary">
                            Learn More
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                >
                    <div className="chat-preview glass">
                        <div className="preview-header">
                            <div className="preview-dot" />
                            <div className="preview-dot" />
                            <div className="preview-dot" />
                        </div>
                        <div className="preview-messages">
                            <div className="preview-msg agent">
                                👋 Hi! I'm WhisperBite. Ready to find you the perfect table?
                            </div>
                            <div className="preview-msg user">
                                Book a table for 4 this Friday at 7pm
                            </div>
                            <div className="preview-msg agent">
                                🍽️ Great! I found an available slot. The weather looks clear — shall I recommend outdoor seating?
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="features" id="features">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    Everything You Need
                </motion.h2>
                <div className="features-grid">
                    {features.map((feat, i) => (
                        <motion.div
                            key={feat.title}
                            className="feature-card glass"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="feature-icon">
                                <feat.icon size={24} />
                            </div>
                            <h3>{feat.title}</h3>
                            <p>{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <h2>Ready to Reserve?</h2>
                    <p>Experience the future of restaurant booking — powered by AI.</p>
                    <Link to="/book" className="btn-primary btn-lg">
                        <Mic size={20} />
                        Book Now
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}
