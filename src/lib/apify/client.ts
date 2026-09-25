import { ApifyClient } from "apify-client";

let client: ApifyClient | null = null;

export function getApifyClient() {
  if (client) return client;

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("Missing APIFY_API_TOKEN environment variable.");
  }

  client = new ApifyClient({ token });
  return client;
}

export function getOrganizationsActorId() {
  const actorId = process.env.APIFY_ORGANIZATIONS_ACTOR_ID;
  if (!actorId) {
    throw new Error("Missing APIFY_ORGANIZATIONS_ACTOR_ID environment variable.");
  }
  return actorId;
}
