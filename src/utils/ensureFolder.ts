import { App } from "obsidian";

export async function ensureFolder(
  app: App,
  path: string
) {
  const exists = app.vault.getAbstractFileByPath(path);
  if (!exists) {
    await app.vault.createFolder(path);
  }
}
