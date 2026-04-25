import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";

export const AuthService = {
  signOut: () =>
    ApiClient.request(API_ROUTES.AUTH.SIGN_OUT, {
      method: "POST",
    }),
};
