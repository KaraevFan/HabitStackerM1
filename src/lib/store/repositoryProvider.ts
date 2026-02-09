import type { HabitRepository } from "./habitRepository";
import { createLocalStorageRepository } from "./localStorageHabitRepository";

let _repository: HabitRepository | null = null;

/**
 * Get the active HabitRepository instance.
 * Currently returns localStorage-backed implementation.
 * To migrate to Supabase, swap the factory function here.
 */
export function getRepository(): HabitRepository {
  if (!_repository) {
    _repository = createLocalStorageRepository();
  }
  return _repository;
}

/**
 * Override the repository (useful for testing).
 */
export function setRepository(repo: HabitRepository): void {
  _repository = repo;
}

/**
 * Reset to default (useful for testing teardown).
 */
export function resetRepository(): void {
  _repository = null;
}
