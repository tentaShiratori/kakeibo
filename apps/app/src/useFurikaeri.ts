import { useEffect, useState } from "react";
import { emptyFurikaeri, type Furikaeri } from "./furikaeri";
import { getFurikaeri } from "./furikaeriApi";

export function useFurikaeri(month: string, revision: string) {
  const [furikaeri, setFurikaeri] = useState<Furikaeri>(emptyFurikaeri(month));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    setLoadError("");
    void (async () => {
      try {
        const got = await getFurikaeri(month, { signal: ac.signal });
        if (ac.signal.aborted) {
          return;
        }
        if (!got.ok) {
          setLoadError(got.error);
          setFurikaeri(emptyFurikaeri(month));
          return;
        }
        setFurikaeri(got.value);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    })();
    return () => ac.abort();
  }, [month, revision]);

  return { furikaeri, loadError };
}
