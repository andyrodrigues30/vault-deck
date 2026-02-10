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

  // Ensure Front block has a starting '## ' line safely
  const lines = content.split("\n");
  const frontIndex = lines.findIndex(line => line.includes("## Front"));

  if (frontIndex >= 0) {
    if (!lines[frontIndex + 1]) {
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
  // Open the file
  await plugin.app.workspace.openLinkText(filePath, "", true);
  await focusCursor(plugin, "front");
}

export async function focusCursor(
  plugin: FlashcardsPlugin,
  side: string
) {
  console.log(side)
  // Get the active leaf
  const leaf = plugin.app.workspace.getMostRecentLeaf();
  if (!leaf) return;

  const view = leaf.view;

  // Make sure it's a MarkdownView to safely access editor
  if (!(view instanceof MarkdownView)) return;

  const editor: Editor = view.editor;

  // Find the line with ## Front
  const content = editor.getValue();
  const lines = content.split("\n");

  let cursorLine = 0;
  if (side === "front") {
    cursorLine = lines.findIndex(line => line.includes("## Front"));
  } else {
    cursorLine = lines.findIndex(line => line.includes("## Back"));
  }

  console.log(cursorLine)

  if (cursorLine >= 0) {
    // Move cursor to the line below
    editor.setCursor({ line: cursorLine + 2, ch: 0 });
  }
}
