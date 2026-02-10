export function createFlashcardTemplate(
  deck: string,
  backContent: string = ""
): string {
  const today = new Date().toISOString().split("T")[0];

  return `---
type: flashcard
deck: ${deck}
due: ${today}
interval: 1
lastReviewed: ${today}
---

> [!Front]


---

> [!Back]
> ${backContent}
`;
}
