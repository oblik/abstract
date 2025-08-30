export const runtime = 'edge';

interface ApiResponse {
  // Generic response type - will be inferred from the actual API response
  [key: string]: any;
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const fidelity = searchParams.get("fidelity") || "10"; // Default to 10
  const market = searchParams.get("market") || ""; // Default to empty string
  const interval = searchParams.get("interval") || "all"; // Default to all

  try {
    const response = await fetch(
      `https://clob.polymarket.com/prices-history?interval=${interval}&market=${market}&fidelity=${fidelity}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error! Status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    return Response.json(data);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error fetching data" }), {
      status: 500,
    });
  }
}