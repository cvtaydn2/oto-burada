"use server";

import * as ReferenceService from "@/services/reference/reference-records";

/**
 * Proxy functions for Admin Reference UI.
 * These maintain the existing API for the admin dashboard screens
 * while delegating the logic to the unified ReferenceService.
 */

export async function getBrands(query?: string) {
  return ReferenceService.getAdminBrands(query);
}

export async function getModelsByBrand(brandId: string) {
  return ReferenceService.getAdminModelsByBrand(brandId);
}

export async function toggleBrandStatus(id: string, currentStatus: boolean) {
  return ReferenceService.updateBrandStatus(id, !currentStatus);
}

export async function addBrand(name: string) {
  return ReferenceService.upsertBrand(name);
}

export async function updateBrand(id: string, name: string) {
  return ReferenceService.upsertBrand(name, id);
}

export async function deleteBrand(id: string) {
  return ReferenceService.removeBrand(id);
}

export async function createModel(brandId: string, name: string) {
  return ReferenceService.addModel(brandId, name);
}

export async function deleteModel(id: string) {
  return ReferenceService.removeModel(id);
}
