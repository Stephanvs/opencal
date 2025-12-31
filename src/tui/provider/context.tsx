import {
  createContext,
  createResource,
  createSignal,
  onMount,
  useContext,
  type Accessor,
  type ParentProps,
  type Resource,
} from "solid-js";

import { openBrowser, waitForOAuthCallback } from "@core/auth/oauth-flow";
import { logger } from "@core/logger";
import type {
  CalendarEvent,
  CalendarId,
  Provider,
  ProviderId,
  TimeRange,
} from "@core/provider";
import { Registry, Store } from "@core/provider";

interface ProviderContextValue {
  providers: Accessor<Provider[]>;
  addProvider: (factoryName: string) => Promise<boolean>;
  removeProvider: (id: ProviderId) => Promise<void>;
  toggleProvider: (id: ProviderId) => Promise<void>;
  toggleCalendar: (
    providerId: ProviderId,
    calendarId: CalendarId,
  ) => Promise<void>;
  createEventsResource: (
    range: Accessor<TimeRange>,
  ) => Resource<CalendarEvent[]>;
}

function createProviderContext(): ProviderContextValue {
  const [providers, setProviders] = createSignal<Provider[]>([]);

  onMount(async () => {
    const loaded = await Store.all();
    setProviders(loaded);
    logger.info("Loaded providers:", loaded.length);
  });

  const addProvider = async (factoryName: string): Promise<boolean> => {
    const factory = Registry.get(factoryName);
    if (!factory) {
      logger.error(`Unknown provider factory: ${factoryName}`);
      return false;
    }

    const provider = factory.create();
    const success = await provider.init({
      openBrowser,
      waitForCallback: waitForOAuthCallback,
    });

    if (success) {
      await Store.add(provider);
      setProviders((prev) => [...prev, provider]);
      logger.info(`Added provider: ${provider.id}`);
    }

    return success;
  };

  const removeProvider = async (id: ProviderId): Promise<void> => {
    await Store.remove(id);
    setProviders((prev) => prev.filter((p) => p.id !== id));
    logger.info(`Removed provider: ${id}`);
  };

  const toggleProvider = async (id: ProviderId): Promise<void> => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          p.enabled = !p.enabled;
        }
        return p;
      }),
    );
    const provider = providers().find((p) => p.id === id);
    if (provider) {
      await Store.add(provider);
    }
  };

  const toggleCalendar = async (
    providerId: ProviderId,
    calendarId: CalendarId,
  ): Promise<void> => {
    const provider = providers().find((p) => p.id === providerId);
    if (!provider) return;

    const calendars = await provider.getCalendars();
    const calendar = calendars.find((c) => c.id === calendarId);
    if (calendar) {
      calendar.enabled = !calendar.enabled;
      await Store.add(provider);
    }
  };

  const createEventsResource = (
    range: Accessor<TimeRange>,
  ): Resource<CalendarEvent[]> => {
    const [events] = createResource(
      () => ({
        providers: providers().filter((p) => p.enabled),
        range: range(),
      }),
      async ({ providers, range }) => {
        const allEvents: CalendarEvent[] = [];

        for (const provider of providers) {
          try {
            const events = await provider.getEvents(range);
            allEvents.push(...events);
          } catch (error) {
            logger.error(`Failed to fetch events from ${provider.id}:`, error);
          }
        }

        return allEvents;
      },
    );

    return events;
  };

  return {
    providers,
    addProvider,
    removeProvider,
    toggleProvider,
    toggleCalendar,
    createEventsResource,
  };
}

const ProviderContext = createContext<ProviderContextValue>();

export function ProviderProvider(props: ParentProps) {
  const value = createProviderContext();
  return (
    <ProviderContext.Provider value={value}>
      {props.children}
    </ProviderContext.Provider>
  );
}

export function useProvider(): ProviderContextValue {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProvider must be used within a ProviderProvider");
  }
  return context;
}
