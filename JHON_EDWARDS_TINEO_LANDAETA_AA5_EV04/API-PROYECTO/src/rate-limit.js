/** Ventana fija por IP. El reloj se puede sustituir para probar su vencimiento. */
export function createRateLimiter({ maxAttempts = 20, windowMs = 600000, now = Date.now } = {}) {
  const clients = new Map();

  return function consumeAttempt(ip) {
    const currentTime = now();
    // La limpieza evita acumular entradas vencidas indefinidamente.
    for (const [key, item] of clients) {
      if (item.resetAt <= currentTime) clients.delete(key);
    }
    const item = clients.get(ip) ?? { count: 0, resetAt: currentTime + windowMs };
    clients.set(ip, item);
    if (item.count >= maxAttempts) {
      return Math.max(1, Math.ceil((item.resetAt - currentTime) / 1000));
    }
    item.count += 1;
    return 0;
  };
}

