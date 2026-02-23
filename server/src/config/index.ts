import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whisperbite',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',

    // AI / LLM
    groqApiKey: process.env.GROQ_API_KEY || '',
    openWeatherMapApiKey: process.env.OPENWEATHERMAP_API_KEY || '',

    // Business Rules
    maxGuestsPerSlot: parseInt(process.env.MAX_GUESTS_PER_SLOT || '20', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10),
    apiTimeoutMs: parseInt(process.env.API_TIMEOUT_MS || '5000', 10),

    // Security
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10),
} as const;

// Validate critical config at startup
export function validateConfig(): void {
    const warnings: string[] = [];
    if (!process.env.GROQ_API_KEY) warnings.push('GROQ_API_KEY is not set — AI agent will not work');
    if (!process.env.OPENWEATHERMAP_API_KEY) warnings.push('OPENWEATHERMAP_API_KEY is not set — weather tool will use fallback');
    if (config.jwtSecret === 'fallback-secret-change-me') warnings.push('JWT_SECRET using fallback — change in production');

    if (warnings.length > 0) {
        console.warn('\n⚠️  Configuration Warnings:');
        warnings.forEach(w => console.warn(`   • ${w}`));
        console.warn('');
    }
}
