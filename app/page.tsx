export const runtime = 'edge'

import { getInfoCards } from "@/services/user";
import Home from "./Home";
import { getCategories, getTagsByCategory } from "@/services/market";

interface InfoCard {
  _id: string;
  title: string;
  description: string;
  // Add other info card properties as needed
}

interface Category {
  _id: string;
  name: string;
  // Add other category properties as needed
}

export default async function Page() {
  const [infoCardCms, categories, tags] = await Promise.all([fetchCmsContent(), fetchCategories(), fetchTags()]);
  return <Home infoCardCms={infoCardCms} categories={categories} tags={tags} />;
    // Assuming the Home component contains the div we want to modify
}

const fetchCmsContent = async (): Promise<InfoCard[]> => {
  try {
    const { success, result } = await getInfoCards();
    if (success) {
      return result || [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

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

const fetchTags = async (): Promise<string[]> => {
  try {
    const { success, result } = await getTagsByCategory("all");
    if (success) {
      return result || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}