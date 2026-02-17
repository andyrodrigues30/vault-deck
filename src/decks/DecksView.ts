import { ItemView, WorkspaceLeaf, ButtonComponent, IconName } from "obsidian";
import VaultDeckPlugin from "../main";
import { startReview } from "commands/reviewFlashcards";
import { getDeckCount, getDueFlashcardsCount, getTotalFlashcards } from "utils/flashcardUtils";
import { DecksManager } from "./DecksManager";
import { DeckNameModal } from "../modal/DecksModal";
import { DecksEventBus } from "./DecksEventBus";

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

    DecksEventBus.on("refresh", () => {
      void this.refresh();
    });
  }

  async onClose(): Promise<void> {
    DecksEventBus.emit("refresh");
    return Promise.resolve();
  }

  async refresh() {
    await this.renderDecks();
  }

  async renderDecks() {
    const { containerEl } = this;
    containerEl.empty();

    const panelDiv = containerEl.createEl("div", { cls: "panel" })
    const topDiv = panelDiv.createEl("div", { cls: "panel-top" });
    topDiv.createEl("h3", { text: "Decks" });

    const refreshBtn = topDiv.createEl("button", { text: "Refresh" });
    refreshBtn.onclick = () => DecksEventBus.emit("refresh");

    const totalCards = await getTotalFlashcards(this.plugin);
    const totalDue = await getDueFlashcardsCount(this.plugin);
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
        await startReview(this.plugin, false, deck.name);
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
          this.manager.deleteDeck(deck.name)
          await this.renderDecks()
        });
    });
  }

  openCreateModal() {
    const modal = new DeckNameModal(this.plugin.app, (name) => {
      void (async () => {
        await this.manager.createDeck(name);
        await this.renderDecks();
      })();
    });

    modal.open();
  }

  openRenameModal(oldName: string) {
    const modal = new DeckNameModal(this.plugin.app, (newName) => {
      void (async () => {
        await this.manager.renameDeck(oldName, newName);
        await this.renderDecks();
      })();
    });

    modal.open();
  }
}
