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

    // Frontmatter
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) continue;

    const yaml = parseYaml(yamlMatch[1]);
    if (yaml.type !== "flashcard") continue;

    // Front (tolerant)
    const frontMatch = content.match(
      /##\s*Front\s*\n([\s\S]*?)(?:\n---|\n##\s*Back)/
    );

    // Back
    const backMatch = content.match(
      /##\s*Back\s*\n([\s\S]*)$/
    );

    cards.push({
      file,
      type: yaml.type,
      deck:
        typeof yaml.deck === "string"
          ? yaml.deck
          : plugin.settings.defaultDeck,
      front: frontMatch?.[1].trim() ?? "",
      back: backMatch?.[1].trim() ?? "",
      interval: yaml.interval ?? 0,
      due: yaml.due,
      lastReviewed: yaml.lastReviewed,
    });
  }

  return cards;
}

export function filterDueFlashcards(cards: Flashcard[]): Flashcard[] {
  const now = new Date();

  return cards.filter(card => {
    if (!card.due) return true;
    return new Date(card.due) <= now;
  });
}
