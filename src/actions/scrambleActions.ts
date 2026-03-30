/**
 * ScrambleActions — all mutation logic for the scramble.
 *
 * Actions are plain async functions that take the current ViewModel and any
 * needed arguments, update state through the VM, and persist via the repo.
 * They never touch the DOM directly.
 */
import { randomScrambleForEvent } from "cubing/scramble";
import { AppRepository } from "../repositories/AppRepository";
import type { ScrambleViewModel } from "../viewmodels/ScrambleViewModel";

/** Replace the scramble with a freshly generated 333fm scramble. */
export async function generateNewScramble(
  vm: ScrambleViewModel,
): Promise<void> {
  const scramble = (await randomScrambleForEvent("333fm")).toString();
  vm.scramble.set(scramble);
  AppRepository.saveScramble(scramble);
}

/** Apply a user-typed scramble string. */
export function applyManualScramble(
  vm: ScrambleViewModel,
  raw: string,
): void {
  vm.scramble.set(raw);
  AppRepository.saveScramble(raw);
}

/** Toggle the inverse-scramble display. */
export function toggleInverseScramble(vm: ScrambleViewModel): void {
  vm.showingInverse.set(!vm.showingInverse.get());
}
