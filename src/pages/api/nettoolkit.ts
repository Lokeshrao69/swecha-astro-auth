/*export async function GET() {
  const apiKey = import.meta.env.NETTOOLKIT_API_KEY;

  const res = await fetch("https://api.nettoolkit.com/v1/account/test-api-keys", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
