import VaultDeckPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { moveDecksLocation } from "utils/flashcardUtils";

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
      .setName("Decks root folder")
      .setDesc("Name of folder where all decks will be stored")
      .addText((text) => {
        text
          .setPlaceholder("Enter root folder name")
          .setValue(this.plugin.settings.decksRootFolder);

        text.inputEl.addEventListener("blur", () => {
          void (async () => {
            // move decks to new location
            const oldVal = this.plugin.settings.decksRootFolder;
            const newVal = text.getValue().trim();

            try {
              await moveDecksLocation(this.app, oldVal, newVal);
              // only update setting if move succeeded
              this.plugin.settings.decksRootFolder = newVal;
              await this.plugin.saveSettings();
            } catch (err) {
              console.error(err);
              new Notice(
                "Cannot update root folder: folder already exists and is not empty."
              );
              text.setValue(oldVal);
            }
          })();
        });
      });

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
  }
}