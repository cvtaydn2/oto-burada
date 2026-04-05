export interface CityOption {
  city: string;
  districts: string[];
}

export const cityOptions: CityOption[] = [
  {
    city: "İstanbul",
    districts: ["Kadıköy", "Beşiktaş", "Başakşehir", "Pendik"],
  },
  {
    city: "Ankara",
    districts: ["Çankaya", "Yenimahalle", "Etimesgut", "Keçiören"],
  },
  {
    city: "İzmir",
    districts: ["Karşıyaka", "Bornova", "Buca", "Gaziemir"],
  },
];
