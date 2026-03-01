// @ts-nocheck — Phase 2 will completely rewrite this file with Web Speech API
import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './VoiceInput.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VoiceInput({ onResult, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const onResultRef = useRef(onResult);
    onResultRef.current = onResult;

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm',
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks to release the mic
                stream.getTracks().forEach(track => track.stop());

                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                chunksRef.current = [];

                if (blob.size < 100) {
                    toast.error('Recording too short. Hold the mic button and speak.');
                    return;
                }

                // Send to server for transcription
                setIsTranscribing(true);
                try {
                    const formData = new FormData();
                    formData.append('audio', blob, 'recording.webm');

                    const res = await fetch(`${API_BASE}/transcribe`, {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await res.json();

                    if (data.success && data.data.text) {
                        toast.success(`🎙️ "${data.data.text}"`, { duration: 2000 });
                        onResultRef.current(data.data.text);
                    } else {
                        toast.error(data.error || 'Could not transcribe audio. Try again.');
                    }
                } catch (err) {
                    console.error('Transcription failed:', err);
                    toast.error('Failed to transcribe. Is the server running?');
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Mic access error:', err);
            if (err.name === 'NotAllowedError') {
                toast.error('🎙️ Microphone access denied. Please allow mic permissions.');
            } else if (err.name === 'NotFoundError') {
                toast.error('🎤 No microphone found. Please connect one.');
            } else {
                toast.error('Failed to access microphone.');
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const isDisabled = disabled || isTranscribing;

    return (
        <div className="voice-input-wrapper">
            <button
                type="button"
                onClick={toggleRecording}
                disabled={isDisabled}
                className={`mic-btn ${isRecording ? 'listening' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                aria-label={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice input'}
                aria-pressed={isRecording}
            >
                {isTranscribing ? (
                    <Loader2 size={18} className="spin" />
                ) : isRecording ? (
                    <MicOff size={18} />
                ) : (
                    <Mic size={18} />
                )}
                {isRecording && <span className="mic-pulse" />}
            </button>
            {isRecording && (
                <div className="live-transcript" role="status" aria-live="polite">
                    🎙️ Listening... Click again to stop
                </div>
            )}
        </div>
    );
}
