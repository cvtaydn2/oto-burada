"use server";

import { requireAdminUser } from "@/features/auth/lib/session";
import * as ReferenceService from "@/features/shared/services/reference-records";

/**
 * Proxy functions for Admin Reference UI.
 * These maintain the existing API for the admin dashboard screens
 * while delegating the logic to the unified ReferenceService.
 */

export async function getBrands(query?: string) {
  await requireAdminUser();
  return ReferenceService.getAdminBrands(query);
}

export async function getModelsByBrand(brandId: string) {
  await requireAdminUser();
  return ReferenceService.getAdminModelsByBrand(brandId);
}

export async function toggleBrandStatus(id: string, currentStatus: boolean) {
  await requireAdminUser();
  return ReferenceService.updateBrandStatus(id, !currentStatus);
}

export async function addBrand(name: string) {
  await requireAdminUser();
  return ReferenceService.upsertBrand(name);
}

export async function updateBrand(id: string, name: string) {
  await requireAdminUser();
  return ReferenceService.upsertBrand(name, id);
}

export async function deleteBrand(id: string) {
  await requireAdminUser();
  return ReferenceService.removeBrand(id);
}

export async function createModel(brandId: string, name: string) {
  await requireAdminUser();
  return ReferenceService.addModel(brandId, name);
}

export async function deleteModel(id: string) {
  await requireAdminUser();
  return ReferenceService.removeModel(id);
}
