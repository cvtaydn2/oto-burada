import { z } from "zod";

import { expertInspectionGrades, expertInspectionStatuses } from "@/lib/constants/domain";
import type { ExpertInspection } from "@/types";

import { emptyStringToUndefined, invalidMessage, optionalTrimmedString } from "../shared";

export const expertInspectionSchema: z.ZodType<ExpertInspection> = z.object({
  hasInspection: z.boolean(),
  inspectionDate: optionalTrimmedString,
  overallGrade: z.enum(expertInspectionGrades).optional(),
  totalScore: z.coerce.number().int().min(0).max(100).optional(),
  damageRecord: z.enum(expertInspectionStatuses),
  bodyPaint: z.enum(expertInspectionStatuses),
  engine: z.enum(expertInspectionStatuses),
  transmission: z.enum(expertInspectionStatuses),
  suspension: z.enum(expertInspectionStatuses),
  brakes: z.enum(expertInspectionStatuses),
  electrical: z.enum(expertInspectionStatuses),
  interior: z.enum(expertInspectionStatuses),
  tires: z.enum(expertInspectionStatuses),
  acHeating: z.enum(expertInspectionStatuses),
  notes: optionalTrimmedString,
  inspectedBy: optionalTrimmedString,
  documentUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).optional()
  ),
  documentPath: optionalTrimmedString,
});
