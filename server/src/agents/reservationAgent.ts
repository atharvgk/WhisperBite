import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { config } from '../config';
import { weatherTool } from '../tools/weatherTool';
import { availabilityTool } from '../tools/availabilityTool';
import { bookingTool, cancelBookingTool, updateBookingTool } from '../tools/bookingTool';
import { summaryTool } from '../tools/summaryTool';
import { getSession, addToHistory } from '../services/sessionManager';
import logger from '../utils/logger';

const MAX_TOOL_RETRIES = 4;

const SYSTEM_PROMPT = `You are WhisperBite, a friendly and professional AI restaurant reservation assistant. You help customers make, modify, and cancel restaurant reservations through natural conversation.

## Your Personality
- Warm, professional, and efficient
- Use a conversational but not overly casual tone
- Be concise — avoid long paragraphs
- Use relevant emojis sparingly to add warmth

## Slot Filling Process
You need to collect these details for a reservation:
1. **Customer Name** (required)
2. **Number of Guests** (required, must be ≥ 1)
3. **Date** (required, must be a future date, format: YYYY-MM-DD)
4. **Time** (required, format: HH:MM 24h — convert from 12h if needed)
5. **Cuisine Preference** (optional — ask if not mentioned)
6. **Special Requests** (optional — ask if any)

## Conversation Flow
1. Greet the customer warmly
2. Ask for details ONE or TWO at a time — never dump all questions at once
3. Validate each piece of information as you receive it
4. When you have the date, use the check_weather tool to get weather info
5. When you have date + time + guests, use check_availability to verify the slot
6. If slot is unavailable, suggest alternatives from the tool response
7. Once all required slots are filled, use format_booking_summary to present a summary
8. Ask for explicit confirmation before creating the booking
9. On confirmation, use create_booking to finalize
10. Present the booking ID and confirmation details

## Handling Corrections
- If the customer says "change time to 9PM", "make it 4 guests", etc., understand the intent and update accordingly
- If a booking exists, use update_booking tool
- If the customer wants to cancel, use cancel_booking tool

## Critical Rules
- NEVER invent or hallucinate data — only use information from tool responses
- NEVER make a booking without explicit customer confirmation
- NEVER skip the availability check
- NEVER expose raw JSON or tool output in your responses — always translate results into natural, friendly language
- If a tool returns JSON data, read the fields and respond conversationally — never paste the JSON
- If a tool fails, apologize and suggest trying again
- If the weather API fails, mention that weather data is unavailable but proceed with the booking
- Always confirm the date and time clearly to avoid misunderstandings
- Convert informal time references (e.g., "7 in the evening" → "19:00")
- Convert informal date references (e.g., "next Friday" → actual date)
- Do NOT call format_booking_summary until you have ALL required fields filled
- When the customer says "yes", "confirm", "go ahead", "book it", or similar confirmation → IMMEDIATELY call create_booking tool. Do not just say you will — actually call the tool right now.
- After create_booking succeeds, share the booking ID and a warm confirmation message

## Current Date Context
Today's date is: ${new Date().toISOString().split('T')[0]}
Use this to resolve relative dates like "tomorrow", "next week", etc.`;

const tools = [weatherTool, availabilityTool, bookingTool, cancelBookingTool, updateBookingTool, summaryTool];

let llm: ChatGroq | null = null;

function getLLM(): ChatGroq {
    if (!llm) {
        llm = new ChatGroq({
            apiKey: config.groqApiKey,
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            maxTokens: 1024,
        });
    }
    return llm;
}

export async function invokeAgent(sessionId: string, userMessage: string): Promise<string> {
    logger.info(`Agent invoked for session ${sessionId}`, { userMessage });

    const session = getSession(sessionId);
    addToHistory(sessionId, 'user', userMessage);

    try {
        const model = getLLM();
        const modelWithTools = model.bindTools(tools);

        // Build message history
        const messages: BaseMessage[] = [
            new SystemMessage(SYSTEM_PROMPT),
            ...session.history.map(h =>
                h.role === 'user' ? new HumanMessage(h.content) : new AIMessage(h.content)
            ),
        ];

        let response = await modelWithTools.invoke(messages);
        let retries = 0;
        const toolResultCache = new Map<string, string>();

        // Tool calling loop with deduplication
        while (response.tool_calls && response.tool_calls.length > 0 && retries < MAX_TOOL_RETRIES) {
            retries++;
            logger.debug(`Processing ${response.tool_calls.length} tool call(s), iteration ${retries}`);

            // Add the AI response (with tool calls) to context
            const toolMessages: BaseMessage[] = [
                ...messages,
                response,
            ];

            let allDuplicates = true;

            for (const toolCall of response.tool_calls) {
                const cacheKey = `${toolCall.name}:${JSON.stringify(toolCall.args)}`;
                logger.info(`Tool call: ${toolCall.name}`, { args: toolCall.args });

                // Check if this exact tool call was already made
                if (toolResultCache.has(cacheKey)) {
                    logger.warn(`Duplicate tool call detected: ${toolCall.name}, returning cached result`);
                    toolMessages.push(
                        new ToolMessage({
                            content: toolResultCache.get(cacheKey)! + '\n\n[NOTE: This tool was already called with these exact parameters. You already have this data — please use it to respond to the customer directly without calling more tools.]',
                            tool_call_id: toolCall.id || '',
                        })
                    );
                    continue;
                }

                allDuplicates = false;
                const tool = tools.find(t => t.name === toolCall.name);
                if (!tool) {
                    logger.error(`Unknown tool: ${toolCall.name}`);
                    const errMsg = `Error: Tool "${toolCall.name}" not found.`;
                    toolResultCache.set(cacheKey, errMsg);
                    toolMessages.push(
                        new ToolMessage({
                            content: errMsg,
                            tool_call_id: toolCall.id || '',
                        })
                    );
                    continue;
                }

                try {
                    const result = await tool.invoke(toolCall.args);
                    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
                    toolResultCache.set(cacheKey, resultStr);
                    toolMessages.push(
                        new ToolMessage({
                            content: resultStr,
                            tool_call_id: toolCall.id || '',
                        })
                    );
                } catch (toolError: any) {
                    logger.error(`Tool execution error: ${toolCall.name}`, { error: toolError.message });
                    const errMsg = `Tool "${toolCall.name}" failed: ${toolError.message}. Please inform the user and suggest alternatives.`;
                    toolResultCache.set(cacheKey, errMsg);
                    toolMessages.push(
                        new ToolMessage({
                            content: errMsg,
                            tool_call_id: toolCall.id || '',
                        })
                    );
                }
            }

            // If ALL tool calls were duplicates for 2+ consecutive iterations, break out
            if (allDuplicates && retries >= 2) {
                logger.warn('All tool calls were duplicates, breaking loop to force text response');
                break;
            }

            response = await modelWithTools.invoke(toolMessages);
        }

        // If loop exhausted retries and response is empty, force a text-only response
        let agentResponse = typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

        if (!agentResponse || agentResponse === '""' || agentResponse === '[]') {
            logger.warn(`Empty response after tool loop for session ${sessionId}, forcing text-only call`);
            const allMessages: BaseMessage[] = [
                new SystemMessage(SYSTEM_PROMPT),
                ...session.history.map(h =>
                    h.role === 'user' ? new HumanMessage(h.content) : new AIMessage(h.content)
                ),
                new HumanMessage('Please summarize what you know so far and continue the conversation with the customer. Do NOT call any tools — just respond with text.'),
            ];
            const fallbackResponse = await model.invoke(allMessages);
            agentResponse = typeof fallbackResponse.content === 'string'
                ? fallbackResponse.content
                : JSON.stringify(fallbackResponse.content);
        }

        addToHistory(sessionId, 'assistant', agentResponse);
        logger.info(`Agent response for session ${sessionId}`, { response: agentResponse.substring(0, 200) });

        return agentResponse;
    } catch (error: any) {
        logger.error(`Agent error for session ${sessionId}`, { error: error.message, stack: error.stack });

        // LLM failure fallback
        const fallbackMessage = "I'm sorry, I'm having a bit of trouble right now. Could you please try again in a moment? If you're trying to make a reservation, you can also try refreshing the page.";
        addToHistory(sessionId, 'assistant', fallbackMessage);
        return fallbackMessage;
    }
}
