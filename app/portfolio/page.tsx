export const runtime = 'edge';

import PortfolioPage from "./PortfolioPage";
import { getCategories } from "@/services/market";

interface Category {
  _id: string;
  name: string;
  // Add other category properties as needed
}

export default async function Page() {
  const categories = await fetchCategories();
  return <PortfolioPage categories={categories} />
}

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { success, result } = await getCategories();
    if (success) {
      return result || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};