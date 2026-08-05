import { Resolver } from "node:dns/promises"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("Missing MONGODB_URI in .env")

const globalForMongo = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> }

// Some routers' DNS silently drops SRV queries (ECONNREFUSED) even though
// normal A/TXT records resolve fine — so resolve the cluster's seedlist
// ourselves against a public resolver and connect with a plain (non-SRV) URI
// instead of trusting mongodb+srv:// here. Uses its own dns.Resolver instance
// (not the global default) so it can't be knocked over by anything else in
// the dev server touching the process-wide resolver mid-request, and retries
// a few times since the very first lookup right after cold start can be flaky.
async function resolveDirectUri(srvUri: string): Promise<string> {
  const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)\/?(.*)$/)
  if (!match) return srvUri
  const [, auth, host, rest] = match

  let lastErr: unknown
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const resolver = new Resolver()
      resolver.setServers(["8.8.8.8", "1.1.1.1"])
      const [records, txt] = await Promise.all([
        resolver.resolveSrv(`_mongodb._tcp.${host}`),
        resolver.resolveTxt(host).catch(() => [] as string[][]),
      ])
      const seedList = records.map((r) => `${r.name}:${r.port}`).join(",")
      const [path, existingQuery] = rest.split("?")
      const query = new URLSearchParams(txt[0]?.join("") ?? "")
      query.set("tls", "true")
      if (existingQuery) new URLSearchParams(existingQuery).forEach((v, k) => query.set(k, v))
      return `mongodb://${auth}@${seedList}/${path ?? ""}?${query.toString()}`
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)))
    }
  }
  throw lastErr
}

async function connect() {
  const directUri = uri!.startsWith("mongodb+srv://") ? await resolveDirectUri(uri!) : uri!
  return new MongoClient(directUri).connect()
}

export async function getDb() {
  if (!globalForMongo._mongoClientPromise) {
    globalForMongo._mongoClientPromise = connect().catch((err) => {
      // Don't let one failed attempt permanently poison the singleton for the
      // rest of the process's life — clear it so the next call retries fresh.
      globalForMongo._mongoClientPromise = undefined
      throw err
    })
  }
  const client = await globalForMongo._mongoClientPromise
  return client.db("workout_plan")
}
