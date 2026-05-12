"use server";

import {
  addModel,
  getAdminBrands,
  getAdminModelsByBrand,
  removeBrand,
  removeModel,
  updateBrandStatus,
  upsertBrand,
} from "@/features/shared/services/reference/reference-records";

export async function getBrands(query?: string) {
  return getAdminBrands(query);
}

export async function getModelsByBrand(brandId: string) {
  return getAdminModelsByBrand(brandId);
}

export async function toggleBrandStatus(id: string, currentStatus: boolean) {
  return updateBrandStatus(id, !currentStatus);
}

export async function addBrand(name: string) {
  return upsertBrand(name);
}

export async function updateBrand(id: string, name: string) {
  return upsertBrand(name, id);
}

export async function deleteBrand(id: string) {
  return removeBrand(id);
}

export async function createModel(brandId: string, name: string) {
  return addModel(brandId, name);
}

export async function deleteModel(id: string) {
  return removeModel(id);
}
