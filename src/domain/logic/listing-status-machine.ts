import type { ListingStatus } from "@/types";

export type ListingAction = "archive" | "publish" | "reject" | "approve" | "delete";

export class ListingStatusMachine {
  private static transitions: Record<ListingStatus, Partial<Record<ListingAction, ListingStatus>>> =
    {
      draft: {
        publish: "pending",
        delete: "archived",
      },
      pending: {
        approve: "approved",
        reject: "rejected",
      },
      approved: {
        archive: "archived",
      },
      archived: {
        publish: "approved",
      },
      rejected: {
        publish: "pending",
        delete: "archived",
      },
      pending_ai_review: {
        approve: "approved",
        reject: "rejected",
      },
      flagged: {
        archive: "archived",
        reject: "rejected",
      },
    };

  static getNextStatus(current: ListingStatus, action: ListingAction): ListingStatus | null {
    return this.transitions[current]?.[action] || null;
  }

  static canTransition(current: ListingStatus, action: ListingAction): boolean {
    return !!this.getNextStatus(current, action);
  }
}
