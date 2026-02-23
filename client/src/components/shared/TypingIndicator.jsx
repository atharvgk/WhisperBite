import './TypingIndicator.css';

export default function TypingIndicator() {
    return (
        <div className="typing-indicator" role="status" aria-label="Assistant is typing">
            <div className="typing-dot" style={{ animationDelay: '0ms' }} />
            <div className="typing-dot" style={{ animationDelay: '150ms' }} />
            <div className="typing-dot" style={{ animationDelay: '300ms' }} />
        </div>
    );
}
