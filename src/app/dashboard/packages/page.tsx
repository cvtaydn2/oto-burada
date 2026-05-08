import { permanentRedirect } from "next/navigation";

export default function PackagesPage() {
  permanentRedirect("/dashboard/pricing");
}
