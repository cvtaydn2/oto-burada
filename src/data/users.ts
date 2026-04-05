import { profileSchema } from "@/lib/validators";
import type { Profile } from "@/types";

const profileSeed: Profile[] = [
  {
    id: "user-admin-1",
    fullName: "Mert Aydın",
    phone: "+905321112233",
    city: "İstanbul",
    avatarUrl: null,
    role: "admin",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-04-05T09:00:00Z",
  },
  {
    id: "user-1",
    fullName: "Emre Yılmaz",
    phone: "+905321234567",
    city: "İstanbul",
    avatarUrl: null,
    role: "user",
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-04-05T10:00:00Z",
  },
  {
    id: "user-2",
    fullName: "Ayşe Demir",
    phone: "+905339876543",
    city: "Ankara",
    avatarUrl: null,
    role: "user",
    createdAt: "2026-03-18T11:30:00Z",
    updatedAt: "2026-04-05T10:30:00Z",
  },
  {
    id: "user-3",
    fullName: "Burak Kaya",
    phone: "+905359998877",
    city: "İzmir",
    avatarUrl: null,
    role: "user",
    createdAt: "2026-03-17T14:00:00Z",
    updatedAt: "2026-04-05T11:00:00Z",
  },
  {
    id: "user-4",
    fullName: "Zeynep Arslan",
    phone: "+905364445566",
    city: "İstanbul",
    avatarUrl: null,
    role: "user",
    createdAt: "2026-03-15T08:15:00Z",
    updatedAt: "2026-04-05T12:15:00Z",
  },
  {
    id: "user-5",
    fullName: "Kaan Şahin",
    phone: "+905374443322",
    city: "Ankara",
    avatarUrl: null,
    role: "user",
    createdAt: "2026-03-12T16:45:00Z",
    updatedAt: "2026-04-05T12:45:00Z",
  },
];

export const allUsers = profileSchema.array().parse(profileSeed);
export const adminUser = allUsers.find((user) => user.role === "admin")!;
export const exampleUsers = allUsers.filter((user) => user.role === "user");
