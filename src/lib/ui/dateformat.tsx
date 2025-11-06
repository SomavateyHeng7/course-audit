export function formatCreatedDate(date: string | Date): string {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${formattedDate}`;
}