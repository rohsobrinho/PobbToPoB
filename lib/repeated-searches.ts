import { type SearchRow } from "@/lib/db";

export type RepeatedSearch = SearchRow & {
  previousCreatedAt: string;
  diffSeconds: number;
};

export function findRepeatedSearches(searches: SearchRow[]) {
  const lastSeenByUrl = new Map<string, SearchRow>();
  const repeated: RepeatedSearch[] = [];

  const orderedSearches = [...searches].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );

  for (const search of orderedSearches) {
    const previous = lastSeenByUrl.get(search.url);
    if (previous) {
      const diffMs =
        new Date(search.created_at).getTime() - new Date(previous.created_at).getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds <= 240) {
        repeated.push({
          ...search,
          previousCreatedAt: previous.created_at,
          diffSeconds
        });
      }
    }

    lastSeenByUrl.set(search.url, search);
  }

  return repeated.sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}
