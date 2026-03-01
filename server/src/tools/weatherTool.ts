import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { config } from '../config';
import { withTimeout } from '../utils/withTimeout';
import logger from '../utils/logger';

export interface WeatherResult {
    temperature: number | null;
    condition: string;
    description: string;
    icon: string;
    seatingRecommendation: string;
    date?: string;
    location?: string;
    note?: string;
}

export const weatherTool = new DynamicStructuredTool({
    name: 'check_weather',
    description: 'Check the weather forecast for a specific date and location to recommend indoor or outdoor seating. Use this tool when the booking date is known to provide a weather-aware seating recommendation.',
    schema: z.object({
        date: z.string().describe('The date to check weather for, in YYYY-MM-DD format'),
        location: z.string().default('Mumbai').describe('The city to check weather for (defaults to Mumbai, India)'),
    }),
    func: async ({ date, location }) => {
        logger.info(`Weather tool called: date=${date}, location=${location}`);

        const fallback: WeatherResult = {
            temperature: null,
            condition: 'unknown',
            description: '',
            icon: '',
            seatingRecommendation: 'indoor',
            note: 'Weather data unavailable. Recommending indoor seating as a safe default.',
        };

        if (!config.openWeatherMapApiKey) {
            logger.warn('OpenWeatherMap API key not configured, using fallback');
            return JSON.stringify(fallback);
        }

        try {
            const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${config.openWeatherMapApiKey}&units=metric`;

            const response = await withTimeout(
                fetch(url),
                config.apiTimeoutMs,
                'Weather API'
            );

            if (!response.ok) {
                logger.error(`Weather API returned ${response.status}`);
                return JSON.stringify(fallback);
            }

            const data = await response.json();

            // Find the forecast closest to the requested date (noon of that day)
            const targetDate = new Date(date);
            targetDate.setHours(12, 0, 0, 0);
            let closest = data.list?.[0];
            let minDiff = Infinity;

            for (const entry of data.list || []) {
                const entryDate = new Date(entry.dt * 1000);
                const diff = Math.abs(entryDate.getTime() - targetDate.getTime());
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = entry;
                }
            }

            if (!closest) {
                return JSON.stringify(fallback);
            }

            const temp = Math.round(closest.main?.temp ?? 28);
            const condition: string = closest.weather?.[0]?.main ?? 'Clear';
            const description: string = closest.weather?.[0]?.description ?? 'clear sky';
            const icon: string = closest.weather?.[0]?.icon ?? '01d';

            // Seating recommendation logic for Mumbai climate
            const badWeather = ['Rain', 'Snow', 'Thunderstorm', 'Drizzle'];
            let seatingRecommendation = 'indoor';

            if (!badWeather.includes(condition) && temp >= 18 && temp <= 35) {
                seatingRecommendation = 'outdoor — perfect weather for alfresco dining!';
            } else if (badWeather.includes(condition)) {
                seatingRecommendation = 'indoor — rain or storm expected, stay cozy inside.';
            } else if (temp > 35) {
                seatingRecommendation = 'indoor — it\'s quite hot out, so indoor with AC is ideal.';
            } else {
                seatingRecommendation = 'indoor — recommended given the weather conditions.';
            }

            const result: WeatherResult = {
                temperature: temp,
                condition,
                description,
                icon,
                seatingRecommendation,
                date,
                location,
            };

            logger.info('Weather tool result', result);
            return JSON.stringify(result);
        } catch (error: any) {
            logger.error(`Weather tool error: ${error.message}`);
            return JSON.stringify(fallback);
        }
    },
});
