import { App, Modal, Setting, Notice } from "obsidian";

export class ConfirmDeleteModal extends Modal {
  private message: string;
  private onConfirm: () => Promise<void>;

  constructor(app: App, message: string, onConfirm: () => Promise<void>) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h3", { text: "Confirm deletion" });
    contentEl.createEl("p", { text: this.message });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Delete")
          .setWarning()
          .onClick(() => {
            this.close();

            void this.onConfirm().catch((err) => {
              console.error(err);
              new Notice("Failed to delete deck");
            });
          })
      )
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => this.close())
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}
