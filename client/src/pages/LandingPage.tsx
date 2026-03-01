import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, CloudSun, CheckCircle, MessageSquare, Bot, Wind } from 'lucide-react';
import './LandingPage.css';

const features = [
    {
        icon: Mic,
        title: 'Voice Booking',
        desc: 'Just speak your request — our AI listens, understands natural language, and locks in your reservation instantly.',
    },
    {
        icon: CloudSun,
        title: 'Weather-Aware Seating',
        desc: 'We check Mumbai\'s real-time forecast and recommend indoor or outdoor seating so you\'re always comfortable.',
    },
    {
        icon: CheckCircle,
        title: 'Instant Confirmation',
        desc: 'Receive a full booking confirmation with ID, date, time, and details — all in one seamless conversation.',
    },
];

const steps = [
    { icon: Mic,          num: '01', label: 'Speak',           detail: 'Tell the AI your date, time, and guests.' },
    { icon: Bot,          num: '02', label: 'AI Collects',     detail: 'The assistant gathers all required details.' },
    { icon: Wind,         num: '03', label: 'Weather Check',   detail: 'Mumbai forecast fetched and seating recommended.' },
    { icon: CheckCircle,  num: '04', label: 'Confirmed!',      detail: 'Booking saved and summary delivered to you.' },
];

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.55, ease: 'easeOut' } }),
};

export default function LandingPage() {
    return (
        <div className="landing">

            {/* ── Hero ── */}
            <section className="lp-hero">
                <div className="lp-hero-inner">
                    <motion.p
                        className="lp-eyebrow"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Mumbai's AI Reservation Assistant
                    </motion.p>

                    <motion.h1
                        className="lp-hero-title"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        Reserve Your Table,<br />
                        <em>The Smart Way.</em>
                    </motion.h1>

                    <motion.p
                        className="lp-hero-sub"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                    >
                        Speak naturally. Our AI collects your details, checks the weather,
                        and confirms your booking — all in one conversation.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Link to="/book" className="lp-cta">
                            <Mic size={20} />
                            Book a Table
                        </Link>
                    </motion.div>
                </div>

                {/* Decorative chat mockup */}
                <motion.div
                    className="lp-hero-visual"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.35 }}
                    aria-hidden="true"
                >
                    <div className="lp-chat-mock">
                        <div className="lp-mock-bar">
                            <span className="lp-dot r" /><span className="lp-dot y" /><span className="lp-dot g" />
                            <span className="lp-mock-title">WhisperBite</span>
                        </div>
                        <div className="lp-mock-msgs">
                            <div className="lp-msg ai">👋 Hi! Ready to find you the perfect table in Mumbai?</div>
                            <div className="lp-msg user">Book for 4 this Friday at 7 PM</div>
                            <div className="lp-msg ai">🌤️ Weather looks clear — outdoor seating recommended! Shall I confirm?</div>
                            <div className="lp-msg user">Yes, go ahead!</div>
                            <div className="lp-msg ai">✅ Booking Confirmed! ID: BK-1740825600000</div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section className="lp-features" id="features">
                <motion.h2
                    className="lp-section-title"
                    variants={fadeUp} custom={0}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    Everything in One Conversation
                </motion.h2>
                <div className="lp-features-grid">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            className="lp-feature-card"
                            variants={fadeUp} custom={i + 1}
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                        >
                            <div className="lp-feature-icon">
                                <f.icon size={26} />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="lp-how">
                <motion.h2
                    className="lp-section-title"
                    variants={fadeUp} custom={0}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                    How It Works
                </motion.h2>
                <div className="lp-steps">
                    {steps.map((s, i) => (
                        <motion.div
                            key={s.num}
                            className="lp-step"
                            variants={fadeUp} custom={i + 1}
                            initial="hidden" whileInView="visible" viewport={{ once: true }}
                        >
                            <div className="lp-step-num">{s.num}</div>
                            <div className="lp-step-icon"><s.icon size={22} /></div>
                            <h4 className="lp-step-label">{s.label}</h4>
                            <p className="lp-step-detail">{s.detail}</p>
                            {i < steps.length - 1 && <span className="lp-step-connector" aria-hidden="true" />}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="lp-footer" role="contentinfo">
                <span>© 2025 WhisperBite · Mumbai, India</span>
                <Link to="/admin/login" className="lp-footer-link" aria-label="Go to Admin Dashboard">Admin Dashboard</Link>
            </footer>

        </div>
    );
}
