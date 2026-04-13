import { redirect } from "next/navigation";

export default function DashboardListingCreateRedirectPage() {
  redirect("/dashboard/listings?create=true");
}
