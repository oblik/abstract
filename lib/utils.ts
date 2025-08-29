import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { toFixedDown } from "./roundOf";

type ClassValue = string | number | boolean | undefined | null | ClassValue[];
type ClassDictionary = Record<string, any>;
type ClassInput = ClassValue | ClassDictionary;

export function cn(...inputs: ClassInput[]) {
  return twMerge(clsx(inputs));
}

interface Asset {
  balance: string | number;
  locked: string | number;
}

export function availableBalance(asset: Asset | null | undefined): string | number {
  const available = Number(asset?.balance || 0) - Number(asset?.locked || 0);
  return toFixedDown(available, 2);
}