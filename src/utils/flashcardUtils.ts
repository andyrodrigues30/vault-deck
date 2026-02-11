import VaultDeckPlugin from "../main";
import { parseYaml, TFile } from "obsidian";

export interface Flashcard {
  file: TFile;

  type: string;
  deck: string;
  due?: string;
  lastReviewed?: string;
  interval: number;

  front: string;
  back: string;
}

export async function getAllFlashcards(
  plugin: VaultDeckPlugin
): Promise<Flashcard[]> {
  const files = plugin.app.vault.getMarkdownFiles();
  const cards: Flashcard[] = [];

  for (const file of files) {
    const content = await plugin.app.vault.read(file);

    // frontmatter
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) continue;

    const yaml = yamlMatch?.[1] ? parseYaml(yamlMatch[1]) : undefined;

    if (!yaml) {
      console.warn("No YAML match found!");
      continue;
    }

    if (yaml.type !== "flashcard") continue;

    const frontMatch = content.match(
      /##\s*Front\s*\n([\s\S]*?)(?:\n---|\n##\s*Back)/
    );
    const backMatch = content.match(
      /##\s*Back\s*\n([\s\S]*)$/
    );

    const frontText = frontMatch?.[1] ? frontMatch[1].trim() : "";
    const backText = backMatch?.[1] ? backMatch[1].trim() : "";

    cards.push({
      file,
      type: yaml.type,
      deck: typeof yaml.deck === "string" ? yaml.deck : plugin.settings.defaultDeck,
      front: frontText,
      back: backText,
      interval: yaml.interval ?? 0,
      due: yaml.due,
      lastReviewed: yaml.lastReviewed,
    });
  }

  return cards;
}

export async function getTotalFlashcards(plugin: VaultDeckPlugin): Promise<number> {
    const allCards = await getAllFlashcards(plugin);
    return allCards.length;
}

export async function getDueFlashcards(plugin: VaultDeckPlugin): Promise<number> {
    const allCards = await getAllFlashcards(plugin);
    const dueCards = filterDueFlashcards(allCards);
    return dueCards.length;
}

export async function getDeckCount(plugin: VaultDeckPlugin): Promise<number> {
    const allCards = await getAllFlashcards(plugin);
    const deckNames = Array.from(new Set(allCards.map(c => c.deck)));
    return deckNames.length;
}

export function filterDueFlashcards(cards: Flashcard[]): Flashcard[] {
  const now = new Date();

  return cards.filter(card => {
    if (!card.due) return true;
    return new Date(card.due) <= now;
  });
}
