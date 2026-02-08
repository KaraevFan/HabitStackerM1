/**
 * AI Pattern Generator (R18)
 * Orchestrator: calls /api/patterns, transforms to PatternAnalysisResult shape
 * Falls back to rule-based generatePatternAnalysis() on failure
 */

import { HabitData, PatternSnapshot } from '@/types/habit';
import { analyzePatterns } from './patternFinder';
import { generatePatternAnalysis, PatternAnalysisResult } from './insightGenerator';
import { PatternAgentResponse } from '@/lib/ai/prompts/patternAgent';
import { savePatternSnapshot } from '@/lib/store/habitStore';

/**
 * Generate AI-powered pattern analysis
 * Falls back to rule-based on API failure
 */
export async function generateAIPatterns(habitData: HabitData): Promise<PatternAnalysisResult> {
  const checkIns = habitData.checkIns || [];
  const habitType = habitData.system?.habitType || 'time_anchored';
  const patterns = analyzePatterns(checkIns, habitType);

  // Always have rule-based as fallback
  const ruleBasedResult = generatePatternAnalysis(patterns, habitData.system!, habitType);

  try {
    const response = await fetch('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: habitData.system,
        checkIns: checkIns.slice(-14),
        previousSnapshot: habitData.patternHistory?.slice(-1)[0] || null,
        reflections: habitData.reflections || [],
        weekNumber: Math.floor(
          (Date.now() - new Date(habitData.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 7)
        ) + 1,
      }),
    });

    if (!response.ok) {
      console.warn('[AIPatterns] API failed, using rule-based');
      return ruleBasedResult;
    }

    const aiResult: PatternAgentResponse = await response.json();

    // Transform to PatternAnalysisResult shape
    const result: PatternAnalysisResult = {
      insights: aiResult.insights.map((i, idx) => ({
        id: `ai-${idx}`,
        type: i.type === 'warning' ? 'warning' : i.type === 'positive' ? 'positive' : 'neutral',
        icon: i.type === 'positive' ? '✓' : i.type === 'warning' ? '⚠' : '→',
        content: i.content,
      })),
      suggestion: aiResult.suggestion ? {
        id: 'ai-suggestion',
        content: aiResult.suggestion.content,
        actionType: aiResult.suggestion.actionType,
        actionLabel: getActionLabel(aiResult.suggestion.actionType),
      } : null,
      generatedAt: new Date().toISOString(),
    };

    // Save snapshot to cache
    const snapshot: PatternSnapshot = {
      id: `pattern-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      insights: aiResult.insights,
      suggestion: aiResult.suggestion ? {
        content: aiResult.suggestion.content,
        actionType: aiResult.suggestion.actionType,
      } : undefined,
      checkInCount: checkIns.length,
    };
    savePatternSnapshot(snapshot);

    return result;
  } catch (error) {
    console.warn('[AIPatterns] Error, using rule-based:', error);
    return ruleBasedResult;
  }
}

function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    anchor: 'Adjust anchor',
    tiny_version: 'Use tiny version',
    environment: 'Update setup',
    timing: 'Adjust timing',
    general: 'Start reflection',
  };
  return labels[actionType] || 'Apply';
}
