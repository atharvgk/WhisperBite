import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX } from 'lucide-react';
import ChatBubble from '../components/chat/ChatBubble';
import VoiceInput from '../components/chat/VoiceInput';
import TypingIndicator from '../components/shared/TypingIndicator';
import WeatherCard from '../components/chat/WeatherCard';
import BookingSummaryModal from '../components/chat/BookingSummaryModal';
import toast from 'react-hot-toast';
import './BookingPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MESSAGES_KEY = 'whisperbite-messages';
const SESSION_KEY = 'whisperbite-session';

const INITIAL_MESSAGE = {
    role: 'assistant',
    content: "👋 Hello! I'm WhisperBite, your AI reservation assistant. How can I help you today? You can type or use the microphone to speak."
};

function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = 'sess-' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

function loadMessages() {
    try {
        const stored = sessionStorage.getItem(MESSAGES_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch { }
    return [INITIAL_MESSAGE];
}

function saveMessages(messages) {
    try {
        sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch { }
}

function tryParseWeather(text) {
    try {
        const tempMatch = text.match(/(\d+)°?[CF]?\s*(celsius|fahrenheit)?/i);
        const condMatch = text.match(/(clear|cloudy|rain|snow|sunny|overcast|thunderstorm|drizzle)/i);
        const seatMatch = text.match(/(indoor|outdoor)/i);
        if (tempMatch && condMatch) {
            return {
                temperature: parseInt(tempMatch[1]),
                condition: condMatch[1],
                seatingRecommendation: seatMatch ? seatMatch[1] : 'indoor',
            };
        }
    } catch { }
    return null;
}

function tryParseBookingSummary(text) {
    try {
        const idMatch = text.match(/WB-[A-Z0-9]{8}/);
        if (idMatch) {
            const nameMatch = text.match(/(?:name|Name)[:\s]+([^\n,]+)/i);
            const guestMatch = text.match(/(?:guests?|Guests?)[:\s]+(\d+)/i);
            const dateMatch = text.match(/(?:date|Date)[:\s]+(\d{4}-\d{2}-\d{2}|\w+ \d+)/i);
            const timeMatch = text.match(/(?:time|Time)[:\s]+(\d{1,2}:\d{2})/i);
            return {
                bookingId: idMatch[0],
                customerName: nameMatch?.[1]?.trim() || '',
                numberOfGuests: guestMatch ? parseInt(guestMatch[1]) : 0,
                bookingDate: dateMatch?.[1] || '',
                bookingTime: timeMatch?.[1] || '',
            };
        }
    } catch { }
    return null;
}

export default function BookingPage() {
    const [messages, setMessages] = useState(loadMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [weatherData, setWeatherData] = useState(null);
    const [bookingSummary, setBookingSummary] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sessionId = useRef(getSessionId());

    // Persist messages to sessionStorage whenever they change
    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const speakText = useCallback((text) => {
        if (!ttsEnabled || !('speechSynthesis' in window)) return;
        // Strip emojis, markdown, and JSON from TTS
        const clean = text
            .replace(/[^\x00-\x7F]/g, '')  // strip non-ASCII (emojis)
            .replace(/[*_#`]/g, '')
            .replace(/\{[\s\S]*?\}/g, '')   // strip any JSON blobs
            .trim();
        if (!clean) return;
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1;
        utterance.pitch = 1;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }, [ttsEnabled]);

    const addMessage = useCallback((role, content) => {
        setMessages(prev => {
            const updated = [...prev, { role, content }];
            saveMessages(updated);
            return updated;
        });
    }, []);

    const sendMessage = async (text) => {
        if (!text.trim() || isLoading) return;

        addMessage('user', text.trim());
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim(), sessionId: sessionId.current }),
            });
            const data = await res.json();

            if (data.success) {
                const responseText = data.data.message;
                addMessage('assistant', responseText);
                speakText(responseText);

                // Check for weather info
                const weather = tryParseWeather(responseText);
                if (weather) setWeatherData(weather);

                // Check for booking confirmation
                const summary = tryParseBookingSummary(responseText);
                if (summary) setBookingSummary(summary);
            } else {
                addMessage('assistant', data.error || "Sorry, something went wrong. Please try again.");
                toast.error(data.error || 'Failed to get response');
            }
        } catch (err) {
            addMessage('assistant', "I'm having trouble connecting right now. Please check your connection and try again.");
            toast.error('Connection failed. Is the server running?');
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleVoiceResult = (transcript) => {
        if (transcript) {
            setInput(transcript);
            sendMessage(transcript);
        }
    };

    const handleClearChat = () => {
        sessionStorage.removeItem(MESSAGES_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        sessionId.current = getSessionId();
        setMessages([INITIAL_MESSAGE]);
        setWeatherData(null);
        setBookingSummary(null);
    };

    return (
        <div className="booking-page">
            <div className="chat-container glass">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h2>🍽️ WhisperBite</h2>
                        <span className="status-dot" />
                        <span className="status-text">Online</span>
                    </div>
                    <div className="chat-header-actions">
                        <button
                            className="tts-toggle"
                            onClick={() => {
                                setTtsEnabled(!ttsEnabled);
                                if (ttsEnabled) speechSynthesis.cancel();
                            }}
                            aria-label={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
                            title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
                        >
                            {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                        <button
                            className="tts-toggle"
                            onClick={handleClearChat}
                            aria-label="Start new conversation"
                            title="Start new conversation"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <ChatBubble key={i} role={msg.role} content={msg.content} />
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <TypingIndicator />
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {weatherData && (
                    <WeatherCard data={weatherData} onClose={() => setWeatherData(null)} />
                )}

                <form className="chat-input-area" onSubmit={handleSubmit}>
                    <VoiceInput onResult={handleVoiceResult} disabled={isLoading} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
                        disabled={isLoading}
                        aria-label="Type your message"
                        maxLength={2000}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        aria-label="Send message"
                        className="send-btn"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            {bookingSummary && (
                <BookingSummaryModal data={bookingSummary} onClose={() => setBookingSummary(null)} />
            )}
        </div>
    );
}
