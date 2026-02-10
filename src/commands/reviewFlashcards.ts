import { Notice } from "obsidian";
import VaultDeckPlugin from "../main";
import { getAllFlashcards, filterDueFlashcards, Flashcard } from "../utils/flashcardUtils";
import { ReviewModal } from "../review/ReviewModal";

/**
 * Register all review commands for VaultDeckPlugin
 */
export function registerReviewCommands(plugin: VaultDeckPlugin) {
  // Review all flashcards (all decks)
  plugin.addCommand({
    id: "review-flashcards-all",
    name: "Review flashcards",
    callback: async () => {
      await startReview(plugin);
    },
  });

  // Review due flashcards (all decks)
  plugin.addCommand({
    id: "review-flashcards-due",
    name: "Review flashcards due",
    callback: async () => {
      await startReview(plugin, true);
    },
  });
}

/**
 * Start a review session
 * @param plugin Plugin instance
 * @param onlyDue Review only due cards
 */
async function startReview(plugin: VaultDeckPlugin, onlyDue = false) {
  let cards: Flashcard[] = await getAllFlashcards(plugin);

  if (onlyDue) cards = filterDueFlashcards(cards);


  if (!cards.length) {
    new Notice("No flashcards to review.");
    return;
  }

  new ReviewModal(plugin.app, plugin, cards).open();
}