import { App } from "obsidian";

export async function ensureFolderExists(
  app: App,
  path: string
) {
  const exists = app.vault.getAbstractFileByPath(path);
  if (!exists) {
    await app.vault.createFolder(path);
  }
}
