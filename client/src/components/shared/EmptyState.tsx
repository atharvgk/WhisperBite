import { LucideIcon, Inbox } from 'lucide-react';

interface Props {
    icon?: LucideIcon;
    title?: string;
    description?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', description = '' }: Props) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
        }}>
            <Icon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {title}
            </h3>
            {description && (
                <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
                    {description}
                </p>
            )}
        </div>
    );
}
