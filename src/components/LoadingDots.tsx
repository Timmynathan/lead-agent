/** Three small dots bouncing in sequence — an unmistakable "still working" indicator. */
export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 pl-1" aria-hidden>
      <span
        className="h-1 w-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "0ms", animationDuration: "900ms" }}
      />
      <span
        className="h-1 w-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "150ms", animationDuration: "900ms" }}
      />
      <span
        className="h-1 w-1 animate-bounce rounded-full bg-current"
        style={{ animationDelay: "300ms", animationDuration: "900ms" }}
      />
    </span>
  );
}
