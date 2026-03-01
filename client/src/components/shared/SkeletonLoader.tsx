import './SkeletonLoader.css';

interface Props {
    width?: string;
    height?: string;
    borderRadius?: string;
    count?: number;
}

/** Renders animated skeleton loading placeholders. */
export default function SkeletonLoader({ width = '100%', height = '20px', borderRadius, count = 1 }: Props) {
    return (
        <div className="skeleton-wrapper" aria-busy="true" aria-label="Loading content">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton"
                    style={{ width, height, borderRadius: borderRadius || 'var(--radius-sm)' }}
                />
            ))}
        </div>
    );
}
