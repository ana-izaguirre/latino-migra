import { describe, it, expect, beforeEach, vi } from "vitest";
import { query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { fetchCommunityPostsPaginated, ALL_CATEGORIES } from "./firebase";

/**
 * The category used to be accepted and ignored: `Comunidad.tsx` fetched the six
 * most recent posts overall and filtered them client-side afterwards. A
 * category whose posts were not among those six looked empty, and "load more"
 * paged through the whole forum rather than the category.
 *
 * These assert the constraint is in the query, which is the only place it can
 * be correct.
 */
describe("fetchCommunityPostsPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(where).mockImplementation(((...args: unknown[]) => ({ _where: args })) as never);
    vi.mocked(orderBy).mockImplementation(((...args: unknown[]) => ({ _orderBy: args })) as never);
    vi.mocked(limit).mockImplementation(((n: number) => ({ _limit: n })) as never);
    vi.mocked(startAfter).mockImplementation(((d: unknown) => ({ _startAfter: d })) as never);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as never);
  });

  const constraints = () => vi.mocked(query).mock.calls[0].slice(1);

  it("filters by category in the query", async () => {
    await fetchCommunityPostsPaginated(6, null, "Trámites");

    expect(where).toHaveBeenCalledWith("category", "==", "Trámites");
    expect(constraints()).toContainEqual({ _where: ["category", "==", "Trámites"] });
  });

  it("does not filter for the all-categories sentinel", async () => {
    await fetchCommunityPostsPaginated(6, null, ALL_CATEGORIES);
    expect(where).not.toHaveBeenCalled();
  });

  it("does not filter when no category is given", async () => {
    await fetchCommunityPostsPaginated();
    expect(where).not.toHaveBeenCalled();
  });

  it("keeps the filter when paging", async () => {
    const cursor = { id: "last-doc" };
    await fetchCommunityPostsPaginated(6, cursor as never, "Vivienda");

    // Both must survive together: the bug was that paging ignored the category.
    expect(constraints()).toContainEqual({ _where: ["category", "==", "Vivienda"] });
    expect(constraints()).toContainEqual({ _startAfter: cursor });
  });

  it("orders by date and asks for one more than the page size", async () => {
    await fetchCommunityPostsPaginated(6, null, "Trámites");

    expect(constraints()).toContainEqual({ _orderBy: ["createdAt", "desc"] });
    // The extra row is how hasMore is known without a second count query.
    expect(constraints()).toContainEqual({ _limit: 7 });
  });

  it("orders the constraints so the filter precedes the sort", async () => {
    await fetchCommunityPostsPaginated(6, null, "Trámites");

    const keys = constraints().map((c) => Object.keys(c as object)[0]);
    expect(keys).toEqual(["_where", "_orderBy", "_limit"]);
  });
});
