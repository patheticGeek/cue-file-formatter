type FaqSectionProps = {
  variant?: "plain" | "card";
};

const FAQ_ITEMS = [
  {
    question: "What cue files are supported?",
    answer:
      "The formatter is built for rekordbox-style `.cue` files with `TRACK`, `TITLE`, `PERFORMER`, and `INDEX 01` entries.",
  },
  {
    question: "Why are some performer names blank?",
    answer:
      "Performer is track-level only. If a track block does not include `PERFORMER`, output keeps that performer field empty.",
  },
  {
    question: "How does time offset work?",
    answer:
      "You can shift all timestamps with positive or negative values. Supported formats include seconds (`+5`, `-2`) and time (`+00:30`, `-00:01:10`).",
  },
  {
    question: "Can I export different formats?",
    answer:
      "Yes. Choose one export format in the right panel, then copy the generated output.",
  },
];

export default function FaqSection({ variant = "plain" }: FaqSectionProps) {
  const wrapperClassName =
    variant === "card"
      ? "rounded-xl border border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900"
      : "";
  const itemClassName =
    variant === "card"
      ? "rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
      : "py-1";

  return (
    <section className={wrapperClassName}>
      <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
      <div className="mt-4 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className={itemClassName}>
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
