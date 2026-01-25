'use client';

import { useState, useCallback } from 'react';
import { TuneUpResponse, TuneUpExtractedData } from './prompts/tuneUpAgent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseTuneUpAgentReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  extractedData: TuneUpExtractedData;
  suggestedResponses: string[] | null;
  isComplete: boolean;
  sendMessage: (message: string) => Promise<void>;
  startConversation: () => Promise<void>;
  reset: () => void;
}

interface HabitInfo {
  anchor: string;
  action: string;
  repsCompleted: number;
}

export function useTuneUpAgent(habitInfo: HabitInfo): UseTuneUpAgentReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<TuneUpExtractedData>({});
  const [suggestedResponses, setSuggestedResponses] = useState<string[] | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const callTuneUpAPI = useCallback(async (
    conversationHistory: Message[],
    userMessage: string
  ): Promise<TuneUpResponse> => {
    const response = await fetch('/api/tuneup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitInfo,
        conversationHistory,
        userMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response');
    }

    const data = await response.json();
    return data.response;
  }, [habitInfo]);

  const startConversation = useCallback(async () => {
    if (messages.length > 0) return; // Already started

    setIsLoading(true);
    setError(null);

    try {
      const response = await callTuneUpAPI([], '');

      setMessages([{ role: 'assistant', content: response.message }]);
      setSuggestedResponses(response.suggestedResponses);

      if (response.extractedData) {
        setExtractedData(prev => ({ ...prev, ...response.extractedData }));
      }

      setIsComplete(response.isComplete);
    } catch (err) {
      console.error('Failed to start tune-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setIsLoading(false);
    }
  }, [messages.length, callTuneUpAPI]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuggestedResponses(null);

    const userMsg: Message = { role: 'user', content: userMessage };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    try {
      const response = await callTuneUpAPI(messages, userMessage);

      const assistantMsg: Message = { role: 'assistant', content: response.message };
      setMessages([...newHistory, assistantMsg]);

      setSuggestedResponses(response.suggestedResponses);

      if (response.extractedData) {
        setExtractedData(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(response.extractedData).filter(([, v]) => v !== null)
          ),
        }));
      }

      setIsComplete(response.isComplete);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, callTuneUpAPI]);

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setExtractedData({});
    setSuggestedResponses(null);
    setIsComplete(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    extractedData,
    suggestedResponses,
    isComplete,
    sendMessage,
    startConversation,
    reset,
  };
}
