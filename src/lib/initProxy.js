/**
 * Initialize global undici dispatcher for HTTP/HTTPS proxy support
 * This must be imported early in the application (e.g., in src/app/layout.js)
 */

import { setGlobalDispatcher, ProxyAgent } from "undici";

let proxyInitialized = false;

/**
 * Initialize global proxy agent based on environment variables
 *
 * Environment variables:
 * - HTTP_PROXY: HTTP proxy URL (e.g., http://127.0.0.1:8888)
 * - HTTPS_PROXY: HTTPS proxy URL (defaults to HTTP_PROXY if not set)
 * - ALL_PROXY: Fallback for both HTTP and HTTPS
 * - NO_PROXY: Comma-separated list of hosts to bypass proxy (e.g., localhost,127.0.0.1)
 * - DISABLE_TLS_VERIFY: Set to '1' or 'true' to disable SSL verification
 */
export function initGlobalProxy() {
  if (proxyInitialized) {
    return;
  }

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;

  if (proxyUrl) {
    const noProxy = process.env.NO_PROXY || "";
    const bypassList = noProxy.split(",").map((host) => host.trim()).filter(Boolean);

    const agentOptions = {
      uri: proxyUrl,
    };

    if (bypassList.length > 0) {
      agentOptions.requestTls = {
        rejectUnauthorized: true,
      };
      agentOptions.connect = {
        rejectUnauthorized: true,
      };
    }

    const proxyAgent = new ProxyAgent(agentOptions);

    setGlobalDispatcher(proxyAgent);

    console.log(`✅ Global proxy initialized: ${proxyUrl}`);
    if (bypassList.length > 0) {
      console.log(`   Bypassing proxy for: ${bypassList.join(", ")}`);
    }
  } else {
    console.log("ℹ️  No proxy configured (HTTP_PROXY/HTTPS_PROXY/ALL_PROXY not set)");
  }

  if (process.env.DISABLE_TLS_VERIFY === "1" || process.env.DISABLE_TLS_VERIFY === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn("⚠️  SSL verification disabled (DISABLE_TLS_VERIFY=true)");
  }

  proxyInitialized = true;
}

initGlobalProxy();
