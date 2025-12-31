import fs from "node:fs/promises";
import path from "node:path";

import { Global } from "@core/global";

import type { Provider } from "./types";
import * as Registry from "./registry";

const filepath = path.join(Global.Path.data, "providers.json");

export async function all(): Promise<Provider[]> {
  const file = Bun.file(filepath);
  const data = await file.json().catch(() => []);

  if (!Array.isArray(data)) return [];

  return data
    .map((config: unknown) => {
      if (!config || typeof config !== "object") return null;
      const { name } = config as { name?: string };
      if (!name) return null;

      const factory = Registry.get(name);
      if (!factory) return null;

      return factory.fromConfig(config);
    })
    .filter((p): p is Provider => p !== null);
}

export async function save(providers: Provider[]): Promise<void> {
  const file = Bun.file(filepath);
  await Bun.write(file, JSON.stringify(providers, null, 2));
  await fs.chmod(filepath, 0o600);
}

export async function add(provider: Provider): Promise<void> {
  const providers = await all();
  const existing = providers.findIndex((p) => p.id === provider.id);
  if (existing >= 0) {
    providers[existing] = provider;
  } else {
    providers.push(provider);
  }
  await save(providers);
}

export async function remove(id: string): Promise<void> {
  const providers = await all();
  const filtered = providers.filter((p) => p.id !== id);
  await save(filtered);
}
