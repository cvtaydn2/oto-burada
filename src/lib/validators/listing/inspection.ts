import { z } from "zod";

import type { ExpertInspection } from "@/types";

import { emptyStringToUndefined, invalidMessage, optionalTrimmedString } from "../shared";

const expertInspectionGradeEnum = z.enum(["a", "b", "c", "d", "e"]);
const expertInspectionStatusEnum = z.enum(["var", "yok", "bilinmiyor"]);

export const expertInspectionSchema: z.ZodType<ExpertInspection> = z.object({
  hasInspection: z.boolean(),
  inspectionDate: optionalTrimmedString,
  overallGrade: expertInspectionGradeEnum.optional(),
  totalScore: z.coerce.number().int().min(0).max(100).optional(),
  damageRecord: expertInspectionStatusEnum,
  bodyPaint: expertInspectionStatusEnum,
  engine: expertInspectionStatusEnum,
  transmission: expertInspectionStatusEnum,
  suspension: expertInspectionStatusEnum,
  brakes: expertInspectionStatusEnum,
  electrical: expertInspectionStatusEnum,
  interior: expertInspectionStatusEnum,
  tires: expertInspectionStatusEnum,
  acHeating: expertInspectionStatusEnum,
  notes: optionalTrimmedString,
  inspectedBy: optionalTrimmedString,
  documentUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).optional()
  ),
  documentPath: optionalTrimmedString,
});
