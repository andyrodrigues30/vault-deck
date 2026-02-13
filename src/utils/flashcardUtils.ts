import { TFile, App, getFrontMatterInfo, FrontMatterInfo } from "obsidian";
import VaultDeckPlugin from "../main";
import { ensureFolderExists } from "./ensureFolderExists";

interface Frontmatter {
  type: string;
  deck: string;
  due?: string;
  lastReviewed?: string;
  interval: number;
}

export interface Flashcard extends Frontmatter {
  file: TFile;
  front: string;
  back: string;
}

export async function getAllFlashcards(
  plugin: VaultDeckPlugin
): Promise<Flashcard[]> {
  const files = plugin.app.vault.getMarkdownFiles();
  const cards: Flashcard[] = [];

  for (const file of files) {
    await readFlashcardContent(plugin, file, cards);
  }

  return cards;
}

export async function getAllFlashcardsInDeck(
  plugin: VaultDeckPlugin,
  deckName: string
): Promise<Flashcard[]> {
  const files = plugin.app.vault.getMarkdownFiles();
  const cards: Flashcard[] = [];

  for (const file of files) {
    // check if file is inside the deck folder
    if (file.path.startsWith(`Decks/${deckName}/`)) {
      await readFlashcardContent(plugin, file, cards);
    }
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

// get stats
export async function getTotalFlashcards(plugin: VaultDeckPlugin): Promise<number> {
  const allCards = await getAllFlashcards(plugin);
  return allCards.length;
}

export async function getDueFlashcardsCount(plugin: VaultDeckPlugin): Promise<number> {
  const allCards = await getAllFlashcards(plugin);
  const dueCards = filterDueFlashcards(allCards);
  return dueCards.length;
}

export async function getDeckCount(plugin: VaultDeckPlugin): Promise<number> {
  const allCards = await getAllFlashcards(plugin);
  const deckNames = Array.from(new Set(allCards.map(c => c.deck)));
  return deckNames.length;
}

export async function moveFlashcardToDeck(app: App, file: TFile, newDeck: string, rootFolder: string) {
  const folderPath = `${rootFolder}/${newDeck}`;
  await ensureFolderExists(app, folderPath)

  const newPath = `${folderPath}/${file.name}`;

  // check it's in the correct location
  if (file.path === newPath) return;

  // move file
  await app.fileManager.renameFile(file, newPath);
}

export async function moveDecksLocation(decksRootFolder: string) {
  // TODO: #27 move all deck folders to new location
}

export async function readFrontmatterAndBody(file: TFile, plugin: VaultDeckPlugin) {
  const content = await plugin.app.vault.read(file);

  const frontmatter = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
  const info: FrontMatterInfo = getFrontMatterInfo(content);
  
  const body: string = info.exists ? content.slice(info.contentStart).trim() : content;

  // extract Front/Back sections
  const frontMatch = body.match(/##\s*Front\s*\n([\s\S]*?)(?:\n##\s*Back|$)/i);
  const backMatch = body.match(/##\s*Back\s*\n([\s\S]*)$/i);
  const frontText = frontMatch?.[1]?.trim() ?? "";
  const backText = backMatch?.[1]?.trim() ?? "";

  return { frontmatter, body, frontText, backText };
}

export async function readFlashcardContent(
  plugin: VaultDeckPlugin,
  file: TFile,
  cards: Flashcard[]
) {
  const { frontmatter, frontText, backText } = await readFrontmatterAndBody(file, plugin);

  if (!frontmatter) {
    console.warn("No frontmatter found!");
    return;
  }

  // process flashcards only
  if (frontmatter.type !== "flashcard") return;


  if (typeof frontmatter.type !== "string") return;
  const interval = typeof frontmatter.interval === "number" ? frontmatter.interval : 0;
  const deck = typeof frontmatter.deck === "string" ? frontmatter.deck : plugin.settings.defaultDeck
  const due = typeof frontmatter.due === "string" ? frontmatter.due : undefined;
  const lastReviewed = typeof frontmatter.lastReviewed === "string" ? frontmatter.lastReviewed : undefined;

  const card = {
    file,
    type: frontmatter.type,
    deck: deck,
    front: frontText,
    back: backText,
    interval: interval,
    due: due,
    lastReviewed: lastReviewed,
  };

  cards.push(card);
}