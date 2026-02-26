export function getGracePeriodDays(categoryName?: string | null, locationName?: string | null): number {
  const cat = categoryName?.toLowerCase() ?? "";

  if (cat.includes("formula")) return 0;
  if (cat.includes("milk") || cat.includes("yogurt") || cat.includes("meat") || cat.includes("poultry") || cat.includes("deli")) return 7;
  if (cat.includes("egg")) return 21;
  if (cat.includes("cereal") || cat.includes("flour")) return 365;
  if (cat.includes("high-acid") || cat.includes("tomato") || cat.includes("fruit") || cat.includes("juice") || cat.includes("peanut butter")) return 540;
  if (cat.includes("pasta") || cat.includes("rice")) return 1095;
  if (cat.includes("low-acid") || cat.includes("bean") || cat.includes("soup") || cat.includes("canned")) return 1825;

  const loc = locationName?.toLowerCase() ?? "";
  if (loc.includes("fridge") || loc.includes("cooler")) return 7;
  if (loc.includes("freezer")) return 365;

  return 365;
}
