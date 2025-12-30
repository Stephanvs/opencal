import fs from "fs/promises";
import path from "path";
import { Global } from "@core/global";
import { z } from "zod";

export namespace Auth {
  export type ProviderId = string;
  export type AccountId = string;

  export const Oauth = z
    .object({
      type: z.literal("oauth"),
      id: z.string(),
      refresh: z.string(),
      access: z.string(),
      expires: z.number(),
    })
    .meta({ ref: "OAuth" });

  export const Info = z
    .discriminatedUnion("type", [Oauth])
    .meta({ ref: "Auth" });
  export type Info = z.infer<typeof Info>;

  const filepath = path.join(Global.Path.data, "auth.json");

  export async function all(): Promise<
    Record<ProviderId, Record<AccountId, Info>>
  > {
    const file = Bun.file(filepath);
    const data = await file
      .json()
      .catch(() => ({}) as Record<ProviderId, Record<AccountId, unknown>>);

    return Object.entries(data).reduce(
      (acc, [providerId, accounts]) => {
        if (!accounts || typeof accounts !== "object") return acc;
        acc[providerId] = Object.entries(
          accounts as Record<AccountId, unknown>,
        ).reduce(
          (accountsAcc, [accountId, info]) => {
            const parsed = Info.safeParse(info);
            if (!parsed.success) return accountsAcc;
            accountsAcc[accountId] = parsed.data;
            return accountsAcc;
          },
          {} as Record<AccountId, Info>,
        );
        return acc;
      },
      {} as Record<ProviderId, Record<AccountId, Info>>,
    );
  }

  export async function allByProvider(
    providerId: ProviderId,
  ): Promise<Record<string, Info>> {
    const data = await all();
    return data[providerId] || {};
  }

  export function isExpired(expires: number): boolean {
    return expires < Date.now();
  }

  export async function set(provider: ProviderId, key: AccountId, info: Info) {
    const file = Bun.file(filepath);
    const data = await all();
    if (!data[provider]) data[provider] = {};
    data[provider][key] = info;
    await Bun.write(file, JSON.stringify(data, null, 2));
    await fs.chmod(file.name!, 0o600);
  }

  export async function remove(providerId: ProviderId, key: AccountId) {
    const file = Bun.file(filepath);
    const data = await all();
    delete data?.[providerId]?.[key];
    await Bun.write(file, JSON.stringify(data, null, 2));
    await fs.chmod(file.name!, 0o600);
  }
}
