/**
 * Fallback formatter for ritual statements.
 * Used when the LLM didn't provide a ritualStatement (legacy data, playbook path).
 */
export function formatRitualStatement(anchor: string, action: string): string {
  const a = anchor.replace(/\.$/, '').trim();
  const act = action.replace(/\.$/, '').trim();
  const actLower = act.charAt(0).toLowerCase() + act.slice(1);

  // If anchor already starts with When/After/Before, use it directly
  if (/^(when|after|before)\s/i.test(a)) {
    return `${a}, ${actLower}.`;
  }
  return `${a}, ${actLower}.`;
}
