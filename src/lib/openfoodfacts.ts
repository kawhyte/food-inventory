import type { ScanResult } from "@/lib/types";

export async function fetchProductByBarcode(
  barcode: string
): Promise<ScanResult> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,image_front_thumb_url`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) return { barcode };

    const data = await res.json();

    if (data.status !== 1 || !data.product) return { barcode };

    const { product_name, image_front_thumb_url } = data.product;

    return {
      barcode,
      name: product_name || undefined,
      imageUrl: image_front_thumb_url || undefined,
    };
  } catch {
    return { barcode };
  }
}
