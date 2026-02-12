import { Notice } from "obsidian";
import VaultDeckPlugin from "../main";
import { getAllFlashcards, filterDueFlashcards, Flashcard, getAllFlashcardsInDeck } from "../utils/flashcardUtils";
import { ReviewModal } from "../modal/ReviewModal";

export function registerReviewCommands(plugin: VaultDeckPlugin) {
  // review all flashcards (all decks)
  plugin.addCommand({
    id: "review-flashcards-all",
    name: "Review flashcards",
    callback: async () => {
      await startReview(plugin);
    },
  });

  // review due flashcards (all decks)
  plugin.addCommand({
    id: "review-flashcards-due",
    name: "Review flashcards due",
    callback: async () => {
      await startReview(plugin, true);
    },
  });
}

export async function startReview(plugin: VaultDeckPlugin, onlyDue = false, deckName = "") {
  let cards: Flashcard[] | [];
  if (deckName === "") {
    // get all flashcards
    cards = await getAllFlashcards(plugin);
  } else {
    // get all flashcards in specific deck
    cards = await getAllFlashcardsInDeck(plugin, deckName);
  }

  if (onlyDue) cards = filterDueFlashcards(cards);

  if (!cards.length) {
    new Notice("No flashcards to review.");
    return;
  }

  new ReviewModal(plugin.app, plugin, cards).open();
}