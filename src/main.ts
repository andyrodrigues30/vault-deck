import { Plugin } from "obsidian";
import { registerCreateCommands } from "./commands/createFlashcard";
import { registerReviewCommands } from "commands/reviewFlashcards";
import { VaultDeckSettings, DEFAULT_SETTINGS } from "settings/settings";
import { VaultDeckSettingsTab } from "settings/SettingsTab";
import { DECKS_VIEW_TYPE, DecksView } from "./decks/DecksView";
import { moveFlashcardToDeck } from "utils/flashcardUtils";

// main plugin class
export default class VaultDeckPlugin extends Plugin {
  settings: VaultDeckSettings;

  async onload() {
    console.debug("Loading Vault Decks Plugin");
    // load settings
    await this.loadSettings();

    // register commands
    registerCreateCommands(this);
    registerReviewCommands(this);

    // register decks side panel
    this.registerView(DECKS_VIEW_TYPE, (leaf) => new DecksView(leaf, this));

    const leftLeaf = this.app.workspace.getLeftLeaf(false);
    if (leftLeaf) {
      await leftLeaf.setViewState({ type: DECKS_VIEW_TYPE, active: true });
    } else {
      console.warn("No left leaf available!");
    }

    // register settings tab
    this.addSettingTab(new VaultDeckSettingsTab(this.app, this));

    // register listner
    this.registerEvent(
      this.app.metadataCache.on("changed", async (file) => {
        if (file.extension !== "md") return;
        const deck = this.app.metadataCache.getFileCache(file)?.frontmatter?.deck as string;
        if (deck) await moveFlashcardToDeck(this.app, file, deck, this.settings.decksRootFolder);
      })
    );
  }

  onunload() {
    console.warn("Unloading Vault Decks Plugin");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<VaultDeckSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

