export const runtime = 'edge';

import { getUserById } from "@/services/user";
import ProfilePage from "./Profile";
import { getCategories } from "@/services/market";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';

export default async function Page(props: { params: Promise<{ slug: string; }> }) {
	const params = await props.params;
  let slug = decodeURIComponent(params.slug);

  const [userResult, categories] = await Promise.all([
    fetchUser(slug),
    fetchCategories()
  ]);

  return (
    <ProfilePage user={userResult.user || null} categories={categories} />
  );
}

const fetchUser = async (username: string) => {
  try {
    const response = await getUserById(username);
    return {
      user: checkApiSuccess(response) ? getResponseResult(response) : null,
      wallet: checkApiSuccess(response) ? (getResponseResult(response) as any).wallet : null
    };
  } catch {
    return { user: null, wallet: null };
  }
};

const fetchCategories = async () => {
  try {
    const response = await getCategories();
    return checkApiSuccess(response) ? getResponseResult(response) : [];
  } catch {
    return [];
  }
};
