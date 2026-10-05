"use client";

/** Prints only the member card (the print stylesheet hides everything else), so a member can save it as a PDF or print it. */
export function PrintCardButton() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      Print or save card as PDF
    </button>
  );
}
