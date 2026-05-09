/**
 * Preservation Tests — Bug 4: ExpertInspectionEditor with hasInspection = false
 *
 * These tests MUST PASS on unfixed code — they establish baseline behavior
 * that must not regress after fixes.
 *
 * Validates: Requirements 3.7, 3.8
 */

import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import type { ListingCreateFormValues } from "@/types";

import { ExpertInspectionEditor } from "../expert-inspection-editor";

function WrapperNoInspection() {
  const form = useForm<ListingCreateFormValues>({
    defaultValues: {
      expertInspection: {
        hasInspection: false,
        damageRecord: "bilinmiyor",
        bodyPaint: "bilinmiyor",
        engine: "bilinmiyor",
        transmission: "bilinmiyor",
        suspension: "bilinmiyor",
        brakes: "bilinmiyor",
        electrical: "bilinmiyor",
        interior: "bilinmiyor",
        tires: "bilinmiyor",
        acHeating: "bilinmiyor",
      },
    },
  });
  return <ExpertInspectionEditor form={form} />;
}

describe("Preservation — ExpertInspectionEditor hasInspection=false (baseline, must pass on unfixed code)", () => {
  /**
   * When hasInspection = false, the grid of inspection fields must NOT be rendered.
   * This behavior is correct in unfixed code and must be preserved after fixes.
   */
  it("should NOT render grid fields when hasInspection is false", () => {
    render(<WrapperNoInspection />);

    // None of the INSPECTION_FIELDS labels should be in the DOM
    expect(screen.queryByText("Hasar Kaydı Sorgusu")).not.toBeInTheDocument();
    expect(screen.queryByText("Kaporta & Boya Durumu")).not.toBeInTheDocument();
    expect(screen.queryByText("Motor Performansı")).not.toBeInTheDocument();
    expect(screen.queryByText("Şanzıman / Vites Geçişleri")).not.toBeInTheDocument();
    expect(screen.queryByText("Yol Tutuş / Süspansiyon")).not.toBeInTheDocument();
    expect(screen.queryByText("Fren Sistemi")).not.toBeInTheDocument();
    expect(screen.queryByText("Elektronik Aksallar")).not.toBeInTheDocument();
    expect(screen.queryByText("İç Kondisyon / Döşeme")).not.toBeInTheDocument();
    expect(screen.queryByText("Lastik Durumu")).not.toBeInTheDocument();
    expect(screen.queryByText("Klima / Isıtma Sistemi")).not.toBeInTheDocument();
  });

  it("should render the YOK/VAR toggle buttons when hasInspection is false", () => {
    render(<WrapperNoInspection />);

    // The toggle header is always visible
    expect(screen.getByText("YOK")).toBeInTheDocument();
    expect(screen.getByText("VAR")).toBeInTheDocument();
  });

  it("should render the empty state message when hasInspection is false", () => {
    render(<WrapperNoInspection />);

    // The "no inspection" placeholder text should be visible
    expect(screen.getByText("Raporun Yok mu?")).toBeInTheDocument();
  });
});
