import VaultDeckPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

// plugin settings tab
export class VaultDeckSettingsTab extends PluginSettingTab {
  plugin: VaultDeckPlugin;

  constructor(app: App, plugin: VaultDeckPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName("Configure").setHeading();

    new Setting(containerEl)
      .setName("Default deck")
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