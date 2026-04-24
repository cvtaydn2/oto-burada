import { API_ROUTES } from "@/lib/constants/api-routes";
import { ApiClient } from "@/lib/utils/api-client";

export const AuthService = {
  signOut: () =>
    ApiClient.request(API_ROUTES.AUTH.SIGN_OUT, {
      method: "POST",
    }),
};
