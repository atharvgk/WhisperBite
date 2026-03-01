import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './VoiceInput.css';

// Augment window for webkit prefix
declare global {
    interface Window {
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

export interface VoiceInputProps {
    onResult: (text: string) => void;
    disabled?: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
}

export default function VoiceInput({ onResult, disabled = false, isMuted, onToggleMute }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [isSupported] = useState<boolean>(() =>
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const speakingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll speechSynthesis.speaking to show/hide the stop-speaking indicator
    useEffect(() => {
        if (!('speechSynthesis' in window)) return;
        speakingTimerRef.current = setInterval(() => {
            setIsSpeaking(speechSynthesis.speaking);
        }, 200);
        return () => {
            if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
        };
    }, []);

    // Clean up recognition on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
        };
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        setInterimText('');
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) {
            toast.error('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        // Cancel any ongoing TTS when mic is pressed
        if ('speechSynthesis' in window && speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setInterimText('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            setInterimText(interim || final);
            if (final) {
                setInterimText('');
                setIsListening(false);
                recognitionRef.current = null;
                onResult(final.trim());
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'no-speech') {
                toast.error('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                toast.error('🎙️ Microphone access denied. Please allow mic permissions.');
            } else if (event.error === 'audio-capture') {
                toast.error('🎤 No microphone found. Please connect one.');
            } else if (event.error !== 'aborted') {
                toast.error(`Voice error: ${event.error}`);
            }
            setIsListening(false);
            setInterimText('');
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            toast.error('Could not start voice input. Please try again.');
            setIsListening(false);
        }
    }, [isSupported, onResult]);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="voice-input-wrapper">
            {/* TTS mute/unmute toggle — state owned by BookingPage */}
            <button
                type="button"
                className="tts-mute-btn"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
                title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
            >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Speaking indicator + stop button */}
            {isSpeaking && (
                <button
                    type="button"
                    className="speaking-stop-btn"
                    onClick={() => speechSynthesis.cancel()}
                    aria-label="Stop AI speaking"
                    title="Stop AI speaking"
                >
                    <StopCircle size={14} />
                    <span>Stop</span>
                </button>
            )}

            {/* Mic button */}
            <button
                type="button"
                onClick={toggleListening}
                disabled={disabled}
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                aria-pressed={isListening}
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening && <span className="mic-pulse" aria-hidden="true" />}
            </button>

            {/* Browser support warning */}
            {!isSupported && (
                <div className="voice-unsupported" role="alert">
                    Voice not supported — use Chrome/Edge
                </div>
            )}

            {/* Live interim transcript */}
            {(isListening || interimText) && (
                <div className="live-transcript" role="status" aria-live="polite">
                    {interimText ? `"${interimText}"` : '🎙️ Listening…'}
                </div>
            )}
        </div>
    );
}
