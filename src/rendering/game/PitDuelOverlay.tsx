import React from "react";
import DuelView from "../../minigame/duel/View/duelView";
import type { DuelResultTier } from "../../minigame/duel/Model/duel-model";

/**
 * Props for the PitDuelOverlay component.
 */
interface PitDuelOverlayProps {
    /**
     * Whether the overlay should be visible.
     * If false, nothing is rendered.
     */
    visible: boolean;

    /**
     * Called when the overlay should be closed.
     * This is typically triggered after the minigame finishes.
     */
    onClose: () => void;

    /**
     * Called when the duel finishes with a result tier.
     * The parent (RacePage) is responsible for emitting the proper event
     * to RaceController via the EventBus.
     */
    onResult: (tier: DuelResultTier) => void;
}

/**
 * Full-screen backdrop style used to dim the main game
 * when the pit-stop duel minigame is active.
 */
const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // ensure this appears above all other UI
};

/**
 * Inner container that constrains the size of the DuelView content.
 */
const innerStyle: React.CSSProperties = {
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
};

/**
 * PitDuelOverlay wraps the DuelView minigame in a modal-style
 * full-screen overlay.
 *
 * Responsibilities:
 * - Show/hide based on `visible`
 * - Render DuelView
 * - Pass the result tier to `onResult` when the duel finishes
 * - Close itself by calling `onClose`
 *
 * It does NOT directly modify game state; it just reports the result
 * upward so the RacePage / RaceController can handle it.
 */
const PitDuelOverlay: React.FC<PitDuelOverlayProps> = ({
    visible,
    onClose,
    onResult,
}) => {
    if (!visible) {
        // Do not render anything when the overlay is not visible.
        return null;
    }

    return (
        <div style={backdropStyle}>
            <div style={innerStyle}>
                <DuelView
                    difficulty="MEDIUM"
                    /**
                     * Called by the Duel controller when the minigame finishes.
                     * We:
                     *  - propagate the result up via onResult
                     *  - immediately close the overlay via onClose
                     */
                    onFinished={(tier) => {
                        onResult(tier);
                        onClose();
                    }}
                />
            </div>
        </div>
    );
};

export default PitDuelOverlay;
