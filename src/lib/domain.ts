/**
 * Domain & Subdomain utilities for TechShop POS & Staff Portal
 */

export function isAppSubdomain(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0].toLowerCase();
  return (
    hostname.startsWith("app.") ||
    hostname.startsWith("staff.") ||
    hostname === "app.localhost"
  );
}

/**
 * Get target URL for the App Subdomain (Employee Portal)
 */
export function getAppPortalUrl(currentHost?: string | null, path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (typeof window !== "undefined") {
    const loc = window.location;
    const hostname = loc.hostname.toLowerCase();
    const port = loc.port ? `:${loc.port}` : "";
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${loc.protocol}//app.localhost${port}${cleanPath}`;
    }
    
    // Production / Staging domain
    if (hostname.startsWith("app.")) {
      return `${loc.protocol}//${hostname}${port}${cleanPath}`;
    }
    
    return `${loc.protocol}//app.${hostname}${port}${cleanPath}`;
  }

  // Server-side fallback
  if (currentHost) {
    const hostname = currentHost.split(":")[0].toLowerCase();
    const portMatch = currentHost.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : "";
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://app.localhost${port}${cleanPath}`;
    }
    if (hostname.startsWith("app.")) {
      return `https://${hostname}${port}${cleanPath}`;
    }
    return `https://app.${hostname}${port}${cleanPath}`;
  }

  return `http://app.localhost:3000${cleanPath}`;
}

/**
 * Get target URL for the Main POS Domain
 */
export function getMainPosUrl(currentHost?: string | null, path: string = "/pos"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const loc = window.location;
    const hostname = loc.hostname.toLowerCase();
    const port = loc.port ? `:${loc.port}` : "";

    if (hostname === "app.localhost") {
      return `${loc.protocol}//localhost${port}${cleanPath}`;
    }

    if (hostname.startsWith("app.")) {
      const rootDomain = hostname.replace(/^app\./, "");
      return `${loc.protocol}//${rootDomain}${port}${cleanPath}`;
    }

    return `${loc.protocol}//${hostname}${port}${cleanPath}`;
  }

  // Server-side fallback
  if (currentHost) {
    const hostname = currentHost.split(":")[0].toLowerCase();
    const portMatch = currentHost.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : "";

    if (hostname === "app.localhost") {
      return `http://localhost${port}${cleanPath}`;
    }
    if (hostname.startsWith("app.")) {
      const rootDomain = hostname.replace(/^app\./, "");
      return `https://${rootDomain}${port}${cleanPath}`;
    }
    return `http://${hostname}${port}${cleanPath}`;
  }

  return `http://localhost:3000${cleanPath}`;
}
