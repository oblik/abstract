export const runtime = 'edge';

import { getUserById } from "@/services/user";
import ProfilePage from "./Profile";
import { getCategories } from "@/services/market";
import { checkApiSuccess, getResponseResult } from '@/lib/apiHelpers';

export default async function Page(props: { params: Promise<{ slug: string; }> }) {
  const params = await props.params;
  let slug = decodeURIComponent(params.slug);

  console.log("=== Profile Page Server-side Debug ===");
  console.log("Slug parameter:", slug);

  const [userResult, categories] = await Promise.all([
    fetchUser(slug),
    fetchCategories()
  ]);

  console.log("User result:", userResult);
  console.log("Categories result:", categories);

  return (
    <ProfilePage user={userResult.user && Object.keys(userResult.user).length > 0 ? userResult.user as any : null} categories={categories} />
  );
}

const fetchUser = async (username: string) => {
  console.log("=== fetchUser called ===");
  console.log("Username:", username);
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Is server-side:", typeof window === "undefined");

  try {
    console.log("Making API call to getUserById...");
    const response = await getUserById(username);
    console.log("getUserById response status:", response?.success || response?.status);
    console.log("getUserById response message:", response?.message);
    console.log("getUserById full response:", response);

    const isSuccess = response?.success === true || response?.status === true;
    console.log("Is API call successful:", isSuccess);

    if (isSuccess) {
      const userData = response?.result || response?.data;
      console.log("User data extracted:", userData);

      const result = {
        user: userData,
        wallet: userData?.wallet || userData?.walletAddress
      };
      console.log("fetchUser result:", result);
      return result;
    } else {
      console.log("API call failed, returning null user");
      return { user: null, wallet: null };
    }
  } catch (error) {
    console.error("Error in fetchUser:", error);
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
