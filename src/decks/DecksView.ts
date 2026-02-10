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

  getViewType(): string { return DECKS_VIEW_TYPE }

  getDisplayText(): string { return "Decks" }

  getIcon(): IconName { return "layers" }

  async onOpen(): Promise<void> {
    this.renderDecks();
  }

  async onClose(): Promise<void> { }

  async renderDecks() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.style.padding = "1em";
    containerEl.createEl("h3", { text: "Decks" });

    new ButtonComponent(containerEl)
      .setButtonText("Create Deck")
      .onClick(() => this.openCreateModal());

    const decks = await this.manager.getDeckList();

    decks.forEach(deck => {
      const deckEl = containerEl.createDiv({ cls: "deck-item" });
      deckEl.style.paddingTop = "1em";
      deckEl.style.paddingBottom = "1em";
      deckEl.createEl("span", { text: `${deck.name} (${deck.due}/${deck.total})` });
      deckEl.style.display = "flex";
      deckEl.style.justifyContent = "space-between";

      const deckBtnsEl = deckEl.createDiv({ cls: "deck-btns" });
      deckEl.style.display = "flex";
      deckEl.style.justifyContent = "space-between";

      const renameBtn = new ButtonComponent(deckBtnsEl)
        .setButtonText("Rename")
        .onClick(() => this.openRenameModal(deck.name));
      renameBtn.buttonEl.style.marginLeft = "1em";
      renameBtn.buttonEl.style.marginRight = "1em";


      const deleteBtn = new ButtonComponent(deckBtnsEl)
        .setButtonText("Delete")
        .onClick(() => this.manager.deleteDeck(deck.name).then(() => this.renderDecks()));
      deleteBtn.buttonEl.style.marginLeft = "1em";
      deleteBtn.buttonEl.style.marginRight = "1em";
    });
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
