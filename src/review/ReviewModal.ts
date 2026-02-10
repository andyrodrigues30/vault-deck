import { Modal, Notice } from "obsidian";
import { Flashcard } from "../utils/flashcardUtils";
import VaultDeckPlugin from "../main";

export class ReviewModal extends Modal {
    plugin: VaultDeckPlugin;
    cards: Flashcard[];
    currentIndex = 0;
    showingFront = true;

    constructor(app, plugin: VaultDeckPlugin, cards: Flashcard[]) {
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
        const modalEl = this.contentEl.parentElement; // modal container
        if (!modalEl) return;

        modalEl.style.width = "700px";
        modalEl.style.height = "500px";
        modalEl.style.maxWidth = "90vw";
        modalEl.style.maxHeight = "90vh";
    }

    private showCard(): void {
        const card = this.cards[this.currentIndex];
        this.showingFront = true;
        this.renderCard(card);
    }

    private renderCard(card: Flashcard): void {
        const { contentEl } = this;
        contentEl.empty();

        // Card fills the modal
        const cardEl = contentEl.createEl("div");
        cardEl.style.display = "flex";
        cardEl.style.justifyContent = "center";
        cardEl.style.alignItems = "center";
        cardEl.style.textAlign = "center";
        cardEl.style.flexDirection = "column";
        cardEl.style.cursor = "pointer";
        cardEl.style.userSelect = "none";
        cardEl.style.fontSize = "1.5em";
        cardEl.style.width = "100%";
        cardEl.style.height = "100%";
        cardEl.style.backgroundColor = "var(--background-primary)";
        cardEl.style.position = "relative"; // for absolute buttons

        // Text content
        const textEl = cardEl.createEl("div", {
            text: this.showingFront ? card.front : card.back,
        });
        textEl.style.whiteSpace = "pre-wrap";
        textEl.style.wordBreak = "break-word";
        textEl.style.flex = "1"; // take available vertical space
        textEl.style.display = "flex";
        textEl.style.alignItems = "center";
        textEl.style.justifyContent = "center";

        contentEl.appendChild(cardEl);

        // Interval button container (absolute bottom)
        const intervalContainer = contentEl.createEl("div");
        intervalContainer.style.position = "absolute";
        intervalContainer.style.bottom = "20px";
        intervalContainer.style.left = "50%";
        intervalContainer.style.transform = "translateX(-50%)";
        intervalContainer.style.display = "flex";
        intervalContainer.style.gap = "15px";
        intervalContainer.className = "interval-container";

        contentEl.appendChild(intervalContainer);

        // Click anywhere to flip
        cardEl.onclick = () => {
            this.showingFront = !this.showingFront;
            textEl.setText(this.showingFront ? card.front : card.back);

            // Show interval icons only on back
            this.updateIntervalButtons(card, !this.showingFront, intervalContainer);
        };

        // Initially hide interval icons
        this.updateIntervalButtons(card, false, intervalContainer);
    }

    private updateIntervalButtons(card: Flashcard, show: boolean, container: HTMLElement) {
        container.empty();

        if (!show) return;

        const intervals = [
            { difficulty: "Hard", days: 1 },
            { difficulty: "Medium", days: 3 },
            { difficulty: "Easy", days: 7 },
        ];

        intervals.forEach(({ difficulty, days }) => {
            const btn = container.createEl("button", { text: difficulty });
            btn.style.fontSize = "1em";
            btn.style.cursor = "pointer";
            btn.style.padding = "1em";
            btn.onclick = () => this.markCard(card, days);
        });
    }

    private async markCard(card: Flashcard, intervalDays: number) {
        const { app } = this.plugin;

        const now = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + intervalDays);

        card.lastReviewed = now.toISOString();
        card.due = dueDate.toISOString();
        card.interval = intervalDays;

        const content = await app.vault.read(card.file);

        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let yaml: Record<string, any> = {};
        let frontBackContent = content;

        if (yamlMatch) {
            try {
                yaml = (window as any).yaml?.parse(yamlMatch[1]) || {};
                frontBackContent = content.slice(yamlMatch[0].length).trim();
            } catch {
                yaml = {};
            }
        }

        yaml = Object.assign({}, yaml, {
            type: card.type,
            deck: card.deck,
            lastReviewed: card.lastReviewed,
            due: card.due,
            interval: card.interval,
        });

        const newYaml = `---\n${Object.entries(yaml)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")}\n---`;

        await app.vault.modify(card.file, `${newYaml}\n${frontBackContent}`);

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
}
