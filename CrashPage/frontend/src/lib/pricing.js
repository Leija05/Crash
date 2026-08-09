export const CYCLES = [
  { key: "cycleSemanal", label: "Semanal" },
  { key: "cycleMensual", label: "Mensual" },
  { key: "cycleBimestral", label: "Bimestral" },
  { key: "cycleTrimestral", label: "Trimestral" },
  { key: "cycleAnual", label: "Anual" },
];

export const CYCLE_MULT = { Semanal: 0.3, Mensual: 1, Bimestral: 1.9, Trimestral: 2.7, Anual: 9.6 };

export const B2C_DEVICE = 1499;
export const B2C_SUB = 49;
export const B2B_DEVICE = 1999;
export const B2B_SUB_PER_DRIVER = 150;

export const mx = (n) => `$${Number(Math.round(n)).toLocaleString("es-MX")} MXN`;
