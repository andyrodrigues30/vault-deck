import {
  App,
  PluginSettingTab,
  Setting
} from "obsidian";
import FlashcardsPlugin from "../main";

export class FlashcardSettingTab extends PluginSettingTab {
  plugin: FlashcardsPlugin;

  constructor(app: App, plugin: FlashcardsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", {
      text: "Flashcard Settings"
    });

    new Setting(containerEl)
      .setName("Decks root folder")
      .setDesc("Folder where all flashcard decks are stored")
      .addText((text) =>
        text
          .setPlaceholder("Decks")
          .setValue(this.plugin.settings.decksRootFolder)
          .onChange(async (value) => {
            this.plugin.settings.decksRootFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default deck")
      .setDesc("Deck used when creating new flashcards")
      .addText((text) =>
        text
          .setPlaceholder("default")
          .setValue(this.plugin.settings.defaultDeck)
          .onChange(async (value) => {
            this.plugin.settings.defaultDeck = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
