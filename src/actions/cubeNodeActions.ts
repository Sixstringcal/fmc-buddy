/**
 * CubeNodeActions — all mutation logic for an individual CubeNode card.
 *
 * Each function expresses a clear user intent, keeps the ViewModel clean, and
 * centralises the persistence call so there's one place to look when debugging
 * save/load issues.
 */
import { AppRepository } from "../repositories/AppRepository";
import {
    invertMoves,
    separateMoves,
    simplifyConsecutive,
    stripComments,
    normalizeApostrophes,
} from "../utils/moveAlgebra";
import type { CubeNodeViewModel } from "../viewmodels/CubeNodeViewModel";
import type { AppViewModel } from "../viewmodels/AppViewModel";

// Applies moves.
export function applyMovesFromInput(vm: CubeNodeViewModel, text: string): void {
    vm.rawMoves.set(text);
    persist(vm);
}

// Sets the Mode to be normal or inverse.
export function toggleMode(vm: CubeNodeViewModel): void {
    vm.isNormal.set(!vm.isNormal.get());
    persist(vm);
}

// Set rotation that's applied on top of the scramble but underneath the moves, for rotation purposes.
export function setSecretRotation(
    vm: CubeNodeViewModel,
    rotation: string,
): void {
    vm.secretRotation.set(vm.secretRotation.get() === rotation ? "" : rotation);
    persist(vm);
}

// Marks the node as good, bad, or neutral (null).
export function markAsGood(vm: CubeNodeViewModel): void {
    vm.isGood.set(vm.isGood.get() === true ? null : true);
    persist(vm);
}

export function markAsBad(vm: CubeNodeViewModel): void {
    vm.isGood.set(vm.isGood.get() === false ? null : false);
    persist(vm);
}

// Minimizes the View.
export function toggleMinimized(vm: CubeNodeViewModel): void {
    vm.isMinimized.set(!vm.isMinimized.get());
    persist(vm);
}

// Enables the EO view.
export function toggleEOView(vm: CubeNodeViewModel): void {
    vm.isEOView.set(!vm.isEOView.get());
    persist(vm);
}

export function selectEO(vm: CubeNodeViewModel, index: number): void {
    vm.selectedEOIndex.set(index);
    persist(vm);
}

export function updateEOEntry(
    vm: CubeNodeViewModel,
    index: number,
    text: string,
): void {
    vm.eoList.mutate((list) => {
        list[index] = text;
    });
    persist(vm);
}

export function addEOEntry(vm: CubeNodeViewModel): void {
    vm.eoList.mutate((list) => list.push(""));
    vm.selectedEOIndex.set(vm.eoList.get().length - 1);
    persist(vm);
}

// Updates the position of the cubeView.
export function updatePosition(
    vm: CubeNodeViewModel,
    left: number,
    top: number,
): void {
    vm.position.set({ left, top });
    persist(vm);
}

export function updateTextboxDimensions(
    vm: CubeNodeViewModel,
    width: number,
    height: number,
): void {
    vm.textboxDimensions.set({ width, height });
    persist(vm);
}

/**
 * Creates a new node whose content is either the selected text or the full
 * content of this node.  Returns the new VM so the AppViewModel can register
 * it and wire up the connection.
 */
export function duplicateNode(
    vm: CubeNodeViewModel,
    appVm: AppViewModel,
    selectionStart: number,
    selectionEnd: number,
): CubeNodeViewModel {
    const fullText = vm.rawMoves.get();
    const hasSelection = selectionStart !== selectionEnd;
    const contentToCopy = hasSelection
        ? fullText.substring(selectionStart, selectionEnd)
        : fullText;

    return appVm.createCubeNode({
        initialMoves: contentToCopy,
        sourceId: vm.id,
    });
}

/**
 * Construct the "finished" skeleton (normal + inverted/inverse) and spawn a
 * child node.
 */
export function finishNode(
    vm: CubeNodeViewModel,
    appVm: AppViewModel,
): CubeNodeViewModel {
    const { normalMoves, inverseMoves } = separateMoves(
        stripComments(normalizeApostrophes(vm.rawMoves.get())),
    );
    const finished = `${simplifyConsecutive(normalMoves)} ${invertMoves(
        simplifyConsecutive(inverseMoves),
    )}`.trim();

    return appVm.createCubeNode({ initialMoves: finished, sourceId: vm.id });
}

/** Duplicate to a new node from the currently-selected EO alg. */
export function duplicateEOEntry(
    vm: CubeNodeViewModel,
    appVm: AppViewModel,
): CubeNodeViewModel {
    const eo = vm.eoList.get()[vm.selectedEOIndex.get()] ?? "";
    return appVm.createCubeNode({ initialMoves: eo, sourceId: vm.id });
}

// Deletes the cubeView.
export function deleteNode(
    vm: CubeNodeViewModel,
    appVm: AppViewModel,
): void {
    appVm.removeCubeNode(vm.id);
}

function persist(vm: CubeNodeViewModel): void {
    AppRepository.saveCubeNodeState(vm.toState());
}
