export function calculateClearSize(
  cabinetHeightMm: number,
  cabinetWidthMm: number,
  targetHeightFt: number,
  targetWidthFt: number
) {
  const FT_TO_MM = 304.8;
  const targetHmm = targetHeightFt * FT_TO_MM;
  const targetWmm = targetWidthFt * FT_TO_MM;
  
  const hCabinets = Math.round(targetHmm / cabinetHeightMm);
  const wCabinets = Math.round(targetWmm / cabinetWidthMm);
  
  const clearHeightMm = hCabinets * cabinetHeightMm;
  const clearWidthMm  = wCabinets * cabinetWidthMm;
  
  return {
    hCabinets,
    wCabinets,
    clearHeightMm,
    clearWidthMm,
    clearHeightFt: parseFloat((clearHeightMm / FT_TO_MM).toFixed(2)),
    clearWidthFt:  parseFloat((clearWidthMm  / FT_TO_MM).toFixed(2)),
  };
}
