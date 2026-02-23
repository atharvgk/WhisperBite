import { CloudSun, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './WeatherCard.css';

export default function WeatherCard({ data, onClose }) {
    if (!data) return null;

    return (
        <motion.div
            className="weather-card glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
        >
            <div className="weather-header">
                <CloudSun size={18} />
                <span>Weather Forecast</span>
                <button onClick={onClose} className="weather-close" aria-label="Close weather card">
                    <X size={14} />
                </button>
            </div>
            <div className="weather-body">
                {data.temperature !== null && (
                    <div className="weather-temp">{data.temperature}°C</div>
                )}
                <div className="weather-condition">{data.condition}</div>
                <div className="weather-rec">
                    💺 Recommended: <strong>{data.seatingRecommendation}</strong>
                </div>
            </div>
        </motion.div>
    );
}
