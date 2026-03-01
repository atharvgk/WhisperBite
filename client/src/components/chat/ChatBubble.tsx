import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import './ChatBubble.css';

export interface Props {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

export default function ChatBubble({ role, content, timestamp }: Props) {
    const isAgent = role === 'assistant';

    return (
        <motion.div
            className={`bubble-row ${isAgent ? 'agent' : 'user'}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
        >
            {isAgent && (
                <div className="bubble-avatar agent-avatar" aria-hidden="true">
                    <Bot size={16} />
                </div>
            )}
            <div
                className={`bubble ${isAgent ? 'agent-bubble' : 'user-bubble'}`}
                role="article"
                aria-label={`${isAgent ? 'Assistant' : 'You'}: ${content}`}
            >
                {content}
            </div>
            {!isAgent && (
                <div className="bubble-avatar user-avatar" aria-hidden="true">
                    <User size={16} />
                </div>
            )}
        </motion.div>
    );
}
