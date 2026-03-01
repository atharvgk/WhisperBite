import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    padding: '40px',
                    textAlign: 'center',
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 24px',
                            background: 'var(--primary)',
                            color: '#fff',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
