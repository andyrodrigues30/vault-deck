import { ItemView, WorkspaceLeaf, ButtonComponent, IconName } from "obsidian";
import VaultDeckPlugin from "../main";
import { startReview } from "commands/reviewFlashcards";
import { getDeckCount, getDueFlashcards, getTotalFlashcards } from "utils/flashcardUtils";
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
    await this.renderDecks();
  }

  async onClose(): Promise<void> { }

  async renderDecks() {
    const { containerEl } = this;
    containerEl.empty();

    const panelDiv = containerEl.createEl("div", { cls: "panel" })
    panelDiv.createEl("h3", { text: "Decks" });

    const totalCards = await getTotalFlashcards(this.plugin);
    const totalDue = await getDueFlashcards(this.plugin);
    const totalDecks = await getDeckCount(this.plugin);

    const totalsDiv = panelDiv.createEl("div", { cls: "panel-totals" });
    const tCardDiv = totalsDiv.createEl("div", { cls: "panel-totals-cards" });
    tCardDiv.createEl("p", { text: `${totalCards}` });
    tCardDiv.createEl("p", { text: "Cards", cls: "panel-totals-cards-text" });

    const tDueDiv = totalsDiv.createEl("div", { cls: "panel-totals-due" })
    tDueDiv.createEl("p", { text: `${totalDue}` });
    tDueDiv.createEl("p", { text: "Due", cls: "panel-totals-due-text" });

    const tDecksDiv = totalsDiv.createEl("div", { cls: "panel-totals-decks" })
    tDecksDiv.createEl("p", { text: `${totalDecks}` });
    tDecksDiv.createEl("p", { text: "Decks", cls: "panel-totals-decks-text" });

    new ButtonComponent(panelDiv)
      .setButtonText("Create deck")
      .setClass("panel-create-btn")
      .onClick(() => this.openCreateModal());

    const decks = await this.manager.getDeckList();
    panelDiv.createEl("div", { cls: "panel-decks" });

    decks.forEach(deck => {
      const deckDiv = panelDiv.createEl("div", { cls: "panel-deck-item" });
      const deckText = deckDiv.createEl("p", { text: `${deck.name} (${deck.due}/${deck.total})`, cls: "panel-deck-item-text" });
      deckText.onClickEvent(async () => {
        console.warn(`Review ${deck.name}`);
        await startReview(this.plugin);
      });

      const deckBtnsDiv = deckDiv.createEl("div", { cls: "panel-deck-item-btns" });
      new ButtonComponent(deckBtnsDiv)
        .setButtonText("Rename")
        .setClass("panel-deck-item-btn-rename")
        .onClick(() => this.openRenameModal(deck.name));


      new ButtonComponent(deckBtnsDiv)
        .setButtonText("Delete")
        .setClass("panel-deck-item-btn-delete")
        .onClick(async () => {
          await this.manager.deleteDeck(deck.name)
            .then(() => this.renderDecks())
        });
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
