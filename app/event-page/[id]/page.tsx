import EventPage from "./_components/EventPage";
import { getCategories } from "@/services/market";

interface Category {
  _id: string;
  name: string;
}

export default async function Page() {
  const categories = await fetchCategories();
  return <EventPage categories={categories} />
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