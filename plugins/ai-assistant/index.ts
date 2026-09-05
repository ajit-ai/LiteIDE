export const AIAssistant = {
  complete: (prompt: string) => `LLM completion for: ${prompt}`,
  chat: (msg: string) => `AI response to: ${msg}`,
};
