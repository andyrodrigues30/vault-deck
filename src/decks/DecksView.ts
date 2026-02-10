import { ItemView, WorkspaceLeaf, ButtonComponent, IconName } from "obsidian";
import VaultDeckPlugin from "../main";
import { DecksManager } from "./DecksManager";
import { DeckNameModal } from "./DecksModal";

export const DECKS_VIEW_TYPE = "decks-view";

export class DecksView extends ItemView {
  plugin: VaultDeckPlugin;
  manager: DecksManager;

  constructor(leaf: WorkspaceLeaf, plugin: VaultDeckPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.manager = new DecksManager(plugin);
  }

  getViewType(): string {
    return DECKS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Decks";
  }

  getIcon(): IconName {
    return "layers"
  }

  async onOpen(): Promise<void> {
    this.renderDecks();
  }

  async onClose(): Promise<void> {}

  renderDecks() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h3", { text: "Decks" });

    const decks = this.manager.getDeckList();

    decks.forEach(deck => {
      const deckEl = containerEl.createDiv({ cls: "deck-item" });
      deckEl.createEl("span", { text: deck });

      new ButtonComponent(deckEl)
        .setButtonText("Rename")
        .onClick(() => this.openRenameModal(deck));

      new ButtonComponent(deckEl)
        .setButtonText("Delete")
        .onClick(() => this.manager.deleteDeck(deck).then(() => this.renderDecks()));
    });

    new ButtonComponent(containerEl)
      .setButtonText("Create Deck")
      .onClick(() => this.openCreateModal());
  }

  openCreateModal() {
    const modal = new DeckNameModal(this.plugin.app, async (name) => {
      await this.manager.createDeck(name);
      this.renderDecks();
    });
    modal.open();
  }

  openRenameModal(oldName: string) {
    const modal = new DeckNameModal(this.plugin.app, async (newName) => {
      await this.manager.renameDeck(oldName, newName);
      this.renderDecks();
    });
    modal.open();
  }
}
