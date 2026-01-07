import type { ProviderFactory } from "./types";

const factories = new Map<string, ProviderFactory>();

export function register(factory: ProviderFactory): void {
  if (factories.has(factory.name)) {
    throw new Error(`Provider factory '${factory.name}' already registered`);
  }
  factories.set(factory.name, factory);
}

export function get(name: string): ProviderFactory | undefined {
  return factories.get(name);
}

export function list(): ProviderFactory[] {
  return Array.from(factories.values());
}
