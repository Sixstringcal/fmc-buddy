/**
 * TimerActions — start / pause / reset the countdown.
 *
 * All logic is in the ViewModel; these actions are the public command surface
 * so callers never poke internal ViewModel fields directly.
 */
import type { TimerViewModel } from "../viewmodels/TimerViewModel";

export function startTimer(vm: TimerViewModel): void {
  vm.start();
}

export function pauseTimer(vm: TimerViewModel): void {
  vm.pause();
}

export function resetTimer(vm: TimerViewModel): void {
  vm.reset();
}

export function toggleTimer(vm: TimerViewModel): void {
  vm.toggle();
}
