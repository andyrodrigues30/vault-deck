import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { registerCreateCommands } from "./commands/createFlashcard";
import { DECKS_VIEW_TYPE, DecksView } from "./decks/DecksView";
import { VaultDeckSettings, DEFAULT_SETTINGS } from "settings/settings";
import { registerReviewCommands } from "commands/reviewFlashcards";

// ----------------------------
// Main Plugin Class
// ----------------------------
export default class VaultDeckPlugin extends Plugin {
  settings: VaultDeckSettings;

  async onload() {
    console.debug("Loading Vault Decks Plugin");

    // Load settings
    await this.loadSettings();

    // ----------------------------
    // Register Flashcard Commands
    // ----------------------------
    registerCreateCommands(this);
    registerReviewCommands(this);

    // ----------------------------
    // Register Decks Side Panel
    // ----------------------------
    this.registerView(
      DECKS_VIEW_TYPE,
      (leaf) => new DecksView(leaf, this)
    );

    const rightLeaf = this.app.workspace.getRightLeaf(false);
    if (rightLeaf) {
      rightLeaf.setViewState({
        type: DECKS_VIEW_TYPE,
        active: true,
      });
    } else {
      console.warn("No right leaf available!");
    }

    // ----------------------------
    // Register Settings Tab
    // ----------------------------
    this.addSettingTab(new FlashcardsSettingsTab(this.app, this));
  }

  onunload() {
    console.log("Unloading Vault Decks Plugin");
    this.app.workspace.detachLeavesOfType(DECKS_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// ----------------------------
// Plugin Settings Tab
// ----------------------------
class FlashcardsSettingsTab extends PluginSettingTab {
  plugin: VaultDeckPlugin;

  constructor(app: App, plugin: VaultDeckPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Vault Deck Plugin Settings" });

    new Setting(containerEl)
      .setName("Default Deck")
      .setDesc("Deck used when creating new flashcards if none is specified")
      .addText((text) =>
        text
          .setPlaceholder("Enter default deck")
          .setValue(this.plugin.settings.defaultDeck)
          .onChange(async (value) => {
            this.plugin.settings.defaultDeck = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Decks root folder")
      .setDesc("Name of folder where all decks will be stored")
      .addText((text) =>
        text
          .setPlaceholder("Enter root folder name")
          .setValue(this.plugin.settings.decksRootFolder)
          .onChange(async (value) => {
            this.plugin.settings.decksRootFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
