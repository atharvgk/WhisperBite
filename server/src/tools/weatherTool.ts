import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { config } from '../config';
import { withTimeout } from '../utils/withTimeout';
import logger from '../utils/logger';

export const weatherTool = new DynamicStructuredTool({
    name: 'check_weather',
    description: 'Check the weather forecast for a specific date and location to recommend indoor or outdoor seating. Use this tool when the booking date is known to provide a weather-aware seating recommendation.',
    schema: z.object({
        date: z.string().describe('The date to check weather for, in YYYY-MM-DD format'),
        location: z.string().default('New York').describe('The city to check weather for'),
    }),
    func: async ({ date, location }) => {
        logger.info(`Weather tool called: date=${date}, location=${location}`);

        // Fallback response if API fails
        const fallback = {
            temperature: null,
            condition: 'unknown',
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

            // Find the forecast closest to the requested date
            const targetDate = new Date(date);
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

            const temp = Math.round(closest.main?.temp ?? 20);
            const condition = closest.weather?.[0]?.main ?? 'Clear';
            const description = closest.weather?.[0]?.description ?? '';

            // Seating recommendation logic
            let seatingRecommendation = 'indoor';
            const badWeather = ['Rain', 'Snow', 'Thunderstorm', 'Drizzle'];

            if (!badWeather.includes(condition) && temp >= 15 && temp <= 32) {
                seatingRecommendation = 'outdoor';
            } else if (!badWeather.includes(condition) && temp >= 10) {
                seatingRecommendation = 'outdoor with reservation — it may be a bit cool';
            }

            const result = {
                temperature: temp,
                condition: `${condition} (${description})`,
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
