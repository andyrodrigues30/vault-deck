import VaultDeckPlugin from "../main";
import { Notice } from "obsidian";

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
    if (confirm(`Are you sure you want to delete deck "${name}" and all its cards?`)) {
      const folder = this.plugin.app.vault.getAbstractFileByPath(folderPath);
      if (folder) {
        await this.plugin.app.vault.delete(folder);
        new Notice(`Deck "${name}" deleted`);
      }
    }
  }

  getDeckList(): any[] {
    const decksRoot = this.plugin.settings.decksRootFolder;
    const deckFolders = this.plugin.app.vault.getAllLoadedFiles()
      .filter(f => f.path.startsWith(decksRoot) && f.name !== decksRoot)
      .map(f => f.path.split("/")[1]);
    return Array.from(new Set(deckFolders));
  }
}
