import { permanentRedirect } from "next/navigation";

export default function AdminSupportRedirect() {
  permanentRedirect("/admin/tickets");
}
