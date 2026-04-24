export type PaymentStatus = "pending" | "success" | "failure" | "refunded" | "cancelled";

export class PaymentStatusMachine {
  private static readonly TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    pending: ["success", "failure", "cancelled"],
    success: ["refunded"],
    failure: ["pending"], // Can retry
    refunded: [],
    cancelled: [],
  };

  static canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return this.TRANSITIONS[from]?.includes(to) || false;
  }

  static getNextStatus(
    current: PaymentStatus,
    action: "pay_success" | "pay_fail" | "cancel" | "refund"
  ): PaymentStatus {
    switch (action) {
      case "pay_success":
        return "success";
      case "pay_fail":
        return "failure";
      case "cancel":
        return "cancelled";
      case "refund":
        return "refunded";
      default:
        return current;
    }
  }
}
