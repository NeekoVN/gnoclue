// Comprehensive client-side purge for sign-out
// - Disconnect sockets
// - Clear storages (localStorage, sessionStorage)
// - Clear cookies
// - Delete IndexedDB databases (known app DB + best-effort enumerate)
// - Clear CacheStorage
// - Unregister Service Workers

function clearAllCookies(): void {
  if (typeof document === "undefined") return;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (!name) continue;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
}

async function ensureDeleteDB(name: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  // Best-effort verification and second attempt if the API is available
  try {
    type IDBFactoryEx = IDBFactory & {
      databases?: () => Promise<Array<{ name?: string | null }>>;
    };
    const idbEx: IDBFactoryEx = indexedDB as IDBFactoryEx;
    if (typeof idbEx.databases === "function") {
      await new Promise((r) => setTimeout(r, 50));
      const dbs = (await idbEx.databases()) || [];
      if (dbs.some((d) => d?.name === name)) {
        await new Promise((r) => setTimeout(r, 100));
        await new Promise<void>((resolve) => {
          const req2 = indexedDB.deleteDatabase(name);
          req2.onsuccess = () => resolve();
          req2.onerror = () => resolve();
          req2.onblocked = () => resolve();
        });
      }
    }
  } catch {}
}

async function deleteAllIndexedDB(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const deletions: Array<Promise<void>> = [];
  // Known application DB
  try { deletions.push(ensureDeleteDB("gnoclue-e2e")); } catch {}
  // Best-effort enumerate all DBs (not supported in all browsers)
  try {
    type IDBFactoryEx = IDBFactory & {
      databases?: () => Promise<Array<{ name?: string | null }>>;
    };
    const idbEx: IDBFactoryEx = indexedDB as IDBFactoryEx;
    if (typeof idbEx.databases === "function") {
      const dbs: Array<{ name?: string | null }> = (await idbEx.databases()) || [];
      for (const db of dbs) {
        const name = db?.name;
        if (!name) continue;
        deletions.push(ensureDeleteDB(name));
      }
    }
  } catch {}
  await Promise.allSettled(deletions);
}

async function clearAllCaches(): Promise<void> {
  try {
    if (typeof caches !== "undefined" && caches?.keys) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((k) => caches.delete(k)));
    }
  } catch {}
}

async function unregisterServiceWorkers(): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        regs.map((r: ServiceWorkerRegistration) => r.unregister())
      );
    }
  } catch {}
}

function disconnectGlobalSocket(): void {
  try {
    if (typeof window !== "undefined") {
      const w = window as unknown as { __SOCKET__?: { disconnect: () => void } };
      w.__SOCKET__?.disconnect?.();
      // Leave reference as-is; provider will null it on next render
    }
  } catch {}
}

export async function purgeAllClientData(): Promise<void> {
  try {
    disconnectGlobalSocket();
  } catch {}
  try {
    if (typeof window !== "undefined") {
      try { window.sessionStorage.clear(); } catch {}
      try { window.localStorage.clear(); } catch {}
      // Clear any global user marker used by crypto
      try { (window as unknown as { __auth_user_id?: string }).__auth_user_id = undefined; } catch {}
    }
  } catch {}
  try { clearAllCookies(); } catch {}
  await Promise.allSettled([
    deleteAllIndexedDB(),
    clearAllCaches(),
    unregisterServiceWorkers(),
  ]);
}


