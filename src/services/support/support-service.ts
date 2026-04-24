import { API_ROUTES } from "@/lib/constants/api-routes";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
import { ApiClient } from "@/services/api-client";
import type { CreateTicketInput, Ticket } from "@/services/support/ticket-service";

export class SupportService {
  static async createTicket(input: CreateTicketInput) {
    return ApiClient.request(API_ROUTES.SUPPORT.TICKETS, {
      method: "POST",
      body: JSON.stringify(input),
      schema: apiResponseSchemas.genericMessage,
    });
  }

  static async getTickets() {
    return ApiClient.request<Ticket[]>(API_ROUTES.SUPPORT.TICKETS, {
      method: "GET",
    });
  }
}
