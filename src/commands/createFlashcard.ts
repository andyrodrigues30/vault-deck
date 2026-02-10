import { Editor, MarkdownView, WorkspaceLeaf } from "obsidian";
import FlashcardsPlugin from "../main";
import { ensureFolder } from "../utils/ensureFolder";
import { createFlashcardTemplate } from "../templates/flashcardTemplate";

export function registerCreateCommands(
  plugin: FlashcardsPlugin
) {
  plugin.addCommand({
    id: "create-flashcard",
    name: "Create flashcard",
    callback: () => createFlashcard(plugin)
  });

  plugin.addCommand({
    id: "create-flashcard-selection",
    name: "Create flashcard from selection",
    editorCallback: (editor) =>
      createFlashcardFromSelection(plugin, editor)
  });
}

async function createFlashcard(plugin: FlashcardsPlugin) {
  const deck = plugin.settings.defaultDeck;
  const file = await createFlashcardFile(plugin, deck);

  // Open file and focus cursor under Front marker
  await openFlashcardAndFocus(plugin, file.path);
}

async function createFlashcardFromSelection(
  plugin: FlashcardsPlugin,
  editor: Editor
) {
  const selection = editor.getSelection();
  const deck = plugin.settings.defaultDeck;

  const content = createFlashcardTemplate(deck, selection);
  const file = await createFlashcardFile(plugin, deck, content);

  // Open file and focus cursor under Front marker
  await openFlashcardAndFocus(plugin, file.path);
}

async function createFlashcardFile(
  plugin: FlashcardsPlugin,
  deck: string,
  contentOverride?: string
) {
  const root = plugin.settings.decksRootFolder;
  const deckPath = `${root}/${deck}`;

  await ensureFolder(plugin.app, root);
  await ensureFolder(plugin.app, deckPath);

  const fileName = `flashcard-${Date.now()}.md`;
  const filePath = `${deckPath}/${fileName}`;

  let content = contentOverride ?? createFlashcardTemplate(deck);

  // Ensure Front block has a starting '> ' line safely
  const lines = content.split("\n");
  const frontIndex = lines.findIndex(line => line.includes("> [!Front]"));

  if (frontIndex >= 0) {
    // Insert '> ' only if the next line doesn't exist or doesn't start with '> '
    if (!lines[frontIndex + 1] || !lines[frontIndex + 1].startsWith("> ")) {
      lines.splice(frontIndex + 1, 0, "> ");
      content = lines.join("\n");
    }
  }

  return plugin.app.vault.create(filePath, content);
}

// ------------------------------------------
// Utility to focus cursor under Front marker
// ------------------------------------------
async function openFlashcardAndFocus(
  plugin: FlashcardsPlugin,
  filePath: string
) {
  // Open the file (returns void)
  await plugin.app.workspace.openLinkText(filePath, "", true);

  // Get the active leaf
  const leaf = plugin.app.workspace.getMostRecentLeaf();
  if (!leaf) return;

  const view = leaf.view;

  // Make sure it's a MarkdownView to safely access editor
  if (!(view instanceof MarkdownView)) return;

  const editor: Editor = view.editor;

  // Find the line with > [!Front]
  const content = editor.getValue();
  const lines = content.split("\n");
  const frontLine = lines.findIndex(line => line.includes("> [!Front]"));

  if (frontLine >= 0) {
    // Move cursor to the line below Front marker, after '> '
    editor.setCursor({ line: frontLine + 1, ch: 2 });
  }
}
