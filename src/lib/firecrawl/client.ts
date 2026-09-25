import Firecrawl from "@mendable/firecrawl-js";

let client: Firecrawl | null = null;

export function getFirecrawlClient() {
  if (client) return client;

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY environment variable.");
  }

  client = new Firecrawl({ apiKey });
  return client;
}
