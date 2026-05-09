import process from "node:process";

// DÜZELTME - Koşullu renk desteği (Bug-012 Fix)
const supportsColor = !process.env.NO_COLOR && !process.env.CI && process.stdout.isTTY;

function c(code) {
  return supportsColor ? code : "";
}

export const reset = c("\x1b[0m");
export const bold = c("\x1b[1m");
export const blue = c("\x1b[38;5;45m");
export const purple = c("\x1b[38;5;141m");
export const green = c("\x1b[38;5;84m");
export const cyan = c("\x1b[38;5;51m");
export const yellow = c("\x1b[38;5;220m");
export const red = c("\x1b[38;5;203m");
export const gray = c("\x1b[38;5;244m");
