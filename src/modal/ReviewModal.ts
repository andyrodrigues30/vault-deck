import { App, Modal, Notice } from "obsidian";
import VaultDeckPlugin from "../main";
import { focusCursor } from "commands/createFlashcard";
import { Flashcard, readFrontmatterAndBody } from "../utils/flashcardUtils";
import { DecksEventBus } from "decks/DecksEventBus";

export class ReviewModal extends Modal {
    plugin: VaultDeckPlugin;
    cards: Flashcard[];
    currentIndex = 0;
    showingFront = true;

    constructor(app: App, plugin: VaultDeckPlugin, cards: Flashcard[]) {
        super(app);
        this.plugin = plugin;
        this.cards = cards;
    }

    onOpen(): void {
        this.showCard();
        this.setModalSize();
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private setModalSize() {
        // Set fixed modal dimensions
        const modalEl = this.contentEl.parentElement;
        if (!modalEl) return;

        modalEl.addClass("review-modal");
    }

    private showCard(): void {
        const card = this.cards[this.currentIndex];
        if (!card) {
            console.warn(`No card at index ${this.currentIndex}`);
            return;
        }
        this.showingFront = true;
        this.renderCard(card);
    }


    private renderCard(card: Flashcard): void {
        const { contentEl } = this;
        contentEl.empty();

        // card fills the modal
        const cardDiv = contentEl.createEl("div", { cls: "review-modal-card" });

        // top button
        const topBtnDiv = cardDiv.createEl("div", { cls: "review-modal-card-top" });
        const editBtn = topBtnDiv.createEl("button", { text: "Edit", cls: "review-modal-card-top-edit" });

        editBtn.onclick = async () => {
            // close flashcard
            this.close();
            // open and move cursor to correct position
            const side = this.showingFront ? "front" : "back"
            await this.editCard(side, card);
        };

        // text content
        const cardText = cardDiv.createEl("p", {
            text: this.showingFront ? card.front : card.back,
            cls: "review-modal-card-content"
        });

        // interval buttons
        const bottomBtnDiv = contentEl.createEl("div", { cls: "review-modal-card-bottom" });

        // click card to flip
        cardDiv.onclick = () => {
            this.showingFront = !this.showingFront;
            cardText.setText(this.showingFront ? card.front : card.back);
            // Show interval btns only on back
            this.updateIntervalButtons(card, !this.showingFront, bottomBtnDiv);
        };

        // initially hide interval icons
        this.updateIntervalButtons(card, false, bottomBtnDiv);
    }

    private updateIntervalButtons(card: Flashcard, show: boolean, bottomBtnDiv: HTMLElement) {
        bottomBtnDiv.empty();

        if (!show) return;

        const intervals = [
            { difficulty: "Hard", days: 1 },
            { difficulty: "Medium", days: 3 },
            { difficulty: "Easy", days: 7 },
        ];

        intervals.forEach(({ difficulty, days }) => {
            const btn = bottomBtnDiv.createEl("button", { text: difficulty, cls: "review-modal-card-bottom-btns" });
            btn.onclick = async () => {
                await this.markCard(card, days);
                // refresh side panel
                DecksEventBus.emit("refresh");
            }
        });
    }

    private async markCard(card: Flashcard, intervalDays: number) {
        const plugin = this.plugin;

        let { frontmatter, body } = await readFrontmatterAndBody(card.file, plugin);

        // get new frontmatter values
        const now = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + intervalDays);

        card.lastReviewed = now.toISOString();
        card.due = dueDate.toISOString();
        card.interval = intervalDays;

        frontmatter = {
            ...frontmatter,
            type: card.type,
            deck: card.deck,
            lastReviewed: card.lastReviewed,
            due: card.due,
            interval: card.interval,
        };

        const newFrontmatter = `---\n${Object.entries(frontmatter)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}\n---`;

        await plugin.app.vault.modify(card.file, `${newFrontmatter}\n${body}`);

        this.nextCard();
    }

    private nextCard(): void {
        this.currentIndex++;
        if (this.currentIndex >= this.cards.length) {
            new Notice("Review session complete!");
            this.close();
            return;
        }
        this.showCard();
    }

    private async editCard(side: string, card: Flashcard) {
        this.close();
        // open flashcard md file
        await this.plugin.app.workspace.getLeaf(true).openFile(card.file);

        // focus cursor
        await focusCursor(this.plugin, side);
    }
}
