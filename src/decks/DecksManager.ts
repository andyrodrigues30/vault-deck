import { Notice } from "obsidian";
import VaultDeckPlugin from "../main";
import { getAllFlashcards, filterDueFlashcards } from "../utils/flashcardUtils";
import { ConfirmDeleteModal } from "modal/ConfirmModal";

export class DecksManager {
  plugin: VaultDeckPlugin;

  constructor(plugin: VaultDeckPlugin) {
    this.plugin = plugin;
  }

  async createDeck(name: string) {
    const folderPath = `${this.plugin.settings.decksRootFolder}/${name}`;
    await this.plugin.app.vault.createFolder(folderPath);
    new Notice(`Deck "${name}" created!`);
  }

  async renameDeck(oldName: string, newName: string) {
    const oldPath = `${this.plugin.settings.decksRootFolder}/${oldName}`;
    const newPath = `${this.plugin.settings.decksRootFolder}/${newName}`;

    const folder = this.plugin.app.vault.getAbstractFileByPath(oldPath);
    if (!folder) {
      new Notice(`Deck "${oldName}" does not exist`);
      return;
    }

    await this.plugin.app.vault.rename(folder, newPath);
    // TODO: update deck property in all files in folder
    new Notice(`Deck renamed to "${newName}"`);
  }

  async deleteDeck(name: string) {
    const folderPath = `${this.plugin.settings.decksRootFolder}/${name}`;
    const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);

    if (!folder) {
      new Notice(`Deck "${name}" not found`);
      return;
    }

    new ConfirmDeleteModal(
      this.plugin.app,
      `Are you sure you want to delete deck "${name}" and all its cards?`,
      async () => {
        await this.plugin.app.fileManager.trashFile(folder);
        new Notice(`Deck "${name}" deleted`);
      }
    ).open();
  }

  async getDeckList(): Promise<{ name: string; total: number; due: number }[]> {
    const decksRoot = this.plugin.settings.decksRootFolder;

    // get all md files under the decks root
    const files = this.plugin.app.vault.getFiles().filter(
      f => f.path.startsWith(decksRoot) && f.extension === "md"
    );

    // extract unique deck names
    const deckNames = Array.from(new Set(
      files.map(f => f.path.split("/")[1])
    ));

    // get all flashcards
    const allCards = await getAllFlashcards(this.plugin);

    // build array with total and due counts
    const decks = deckNames.map(deckName => {
      const deckCards = allCards.filter(c => c.deck === deckName);
      const dueCards = filterDueFlashcards(deckCards);

      return {
        name: deckName || "Unknown",
        total: deckCards.length,
        due: dueCards.length
      };
    });

    return decks;
  }

}
