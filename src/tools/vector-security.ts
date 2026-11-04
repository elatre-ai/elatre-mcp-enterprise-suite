import type { CategoryId, ScoredControl } from "../services/scoring-engine.js";

export const VECTOR_CATEGORY: CategoryId = "vector_database_security";

export function vectorControlStatuses(controls: readonly ScoredControl[]): Map<string, ScoredControl["status"]> {
  return new Map(controls.filter((control) => control.category_id === VECTOR_CATEGORY).map((control) => [control.control_id, control.status]));
}
