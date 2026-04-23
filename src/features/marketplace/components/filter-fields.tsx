"use client";

import { BrandFilter } from "./filters/brand-filter";
import { FilterSelect } from "./filters/filter-select";
import { LocationFilter } from "./filters/location-filter";
import { ModelFilter } from "./filters/model-filter";
import { RangeFilter } from "./filters/range-filter";
import { TechnicalFilter } from "./filters/technical-filter";
import { TrimFilter } from "./filters/trim-filter";
import { TrustFilter } from "./filters/trust-filter";

export { FilterSelect };

export const FilterFields = {
  Brand: BrandFilter,
  Model: ModelFilter,
  Trim: TrimFilter,
  Location: LocationFilter,
  Range: RangeFilter,
  Technical: TechnicalFilter,
  Trust: TrustFilter,
};
