import { Modal, Notice, Setting } from "obsidian";
import VaultDeckPlugin from "../main";

export class DeckNameModal extends Modal {
  onSubmit: (name: string) => void;

  constructor(app: VaultDeckPlugin["app"], onSubmit: (name: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Enter deck name" });

    const inputEl = contentEl.createEl("input", {
      type: "text",
      cls: "rename-modal-input",
      placeholder: "Deck name..."
    });
    inputEl.focus();

    inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        this.submit(inputEl.value);
      }
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit").onClick(() => this.close())
          .onClick(() => this.submit(inputEl.value))
      );
  }

  submit(name: string) {
    if (name.trim() !== "") {
      this.onSubmit(name.trim());
      this.close();
    } else {
      new Notice("Deck name cannot be empty");
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
