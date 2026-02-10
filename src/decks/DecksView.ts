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
    this.renderDecks();
  }

  async onClose(): Promise<void> { }

  async renderDecks() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.style.padding = "1em";
    containerEl.createEl("h3", { text: "Decks" });
    
    const totalCards = await getTotalFlashcards(this.plugin);
    const totalDue = await getDueFlashcards(this.plugin);
    const totalDecks = await getDeckCount(this.plugin);
    
    const totalsDiv = containerEl.createDiv({ cls: "panel-totals" });
    totalsDiv.style.display = "flex";
    totalsDiv.style.alignItems = "center";
    totalsDiv.style.justifyContent = "space-between";
    totalsDiv.style.fontSize = "2em";
    totalsDiv.style.lineHeight = ".025em";
    totalsDiv.style.padding = ".5em";


    const tCardDiv = totalsDiv.createDiv({ cls: "t-cards" })
    tCardDiv.createEl("p", { text: `${totalCards}` });
    tCardDiv.style.display = "flex";
    tCardDiv.style.flexDirection = "column";
    tCardDiv.style.alignItems = "center";
    tCardDiv.style.justifyContent = "start";

    const tCardLabel = tCardDiv.createEl("p", { text: "cards" });
    tCardLabel.style.fontSize = ".5em";

    const tDueDiv = totalsDiv.createDiv({ cls: "t-due" })
    tDueDiv.createEl("p", { text: `${totalDue}` });
    tDueDiv.style.display = "flex";
    tDueDiv.style.flexDirection = "column";
    tDueDiv.style.alignItems = "center";
    tDueDiv.style.justifyContent = "start";

    const tDueLabel = tDueDiv.createEl("p", { text: "due" });
    tDueLabel.style.fontSize = ".5em";

    const tDecksDiv = totalsDiv.createDiv({ cls: "t-decks" })
    tDecksDiv.createEl("p", { text: `${totalDecks}` });
    tDecksDiv.style.display = "flex";
    tDecksDiv.style.flexDirection = "column";
    tDecksDiv.style.alignItems = "center";
    tDecksDiv.style.justifyContent = "start";

    const tDecksLabel = tDecksDiv.createEl("p", { text: "decks" });
    tDecksLabel.style.fontSize = ".5em";

    new ButtonComponent(containerEl)
      .setButtonText("Create Deck")
      .onClick(() => this.openCreateModal());

    const decks = await this.manager.getDeckList();

    const decksContainerEl = containerEl.createDiv({ cls: "decks" });
    decksContainerEl.style.paddingTop = "1em";
    decksContainerEl.style.paddingBottom = "1em";

    decks.forEach(deck => {
      const deckEl = containerEl.createDiv({ cls: "deck-item" });
      deckEl.style.paddingTop = ".15em";
      deckEl.style.paddingBottom = ".15em";
      deckEl.createEl("p", { text: `${deck.name} (${deck.due}/${deck.total})` });
      deckEl.style.display = "flex";
      deckEl.style.alignItems = "center";
      deckEl.style.justifyContent = "space-between";
      deckEl.onClickEvent(() => {
        console.log(`Review ${deck.name}`);
        startReview(this.plugin);
      });

      const deckBtnsEl = deckEl.createDiv({ cls: "deck-btns" });
      deckBtnsEl.style.display = "flex";
      deckBtnsEl.style.justifyContent = "space-between";

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
      deleteBtn.buttonEl.style.color = "#FF0000";
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
