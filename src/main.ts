import { Plugin } from "obsidian";
import { registerCreateCommands } from "./commands/createFlashcard";
import { DECKS_VIEW_TYPE, DecksView } from "./decks/DecksView";
import { VaultDeckSettings, DEFAULT_SETTINGS } from "settings/settings";
import { registerReviewCommands } from "commands/reviewFlashcards";
import { VaultDeckSettingsTab } from "settings/SettingsTab";

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

    const rightLeaf = this.app.workspace.getRightLeaf(false);
    if (rightLeaf) {
      await rightLeaf.setViewState({ type: DECKS_VIEW_TYPE, active: true });
    } else {
      console.warn("No right leaf available!");
    }

    // register settings tab
    this.addSettingTab(new VaultDeckSettingsTab(this.app, this));
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

