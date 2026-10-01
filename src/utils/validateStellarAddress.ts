import { StrKey, Horizon } from "@stellar/stellar-sdk";

export type Network = "MAINNET" | "TESTNET";

export type ValidationResult =
  | { valid: true; network: Network }
  | {
      valid: false;
      error: "invalid-format" | "wrong-network" | "not-found" | "network-error";
    };

export type { Horizon };

/**
 * Validates a Stellar address format using StrKey.isValidEd25519PublicKey
 * @param address - The Stellar address to validate
 * @returns true if the address format is valid (56 chars, Base32), false otherwise
 */
export function validateStellarAddressFormat(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  // Strip whitespace
  const cleaned = address.trim().toUpperCase();

  // Check length (Stellar addresses are exactly 56 characters)
  if (cleaned.length !== 56) {
    return false;
  }

  // Use Stellar SDK to validate Ed25519 public key format (Base32)
  return StrKey.isValidEd25519PublicKey(cleaned);
}

/**
 * Checks if the address prefix matches the expected network
 * @param address - The Stellar address
 * @param network - The expected network ('MAINNET' or 'TESTNET')
 * @returns true if the prefix matches, false otherwise
 */
export function checkNetworkPrefix(address: string, network: Network): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }

  const cleaned = address.trim().toUpperCase();
  const firstChar = cleaned.charAt(0);

  // Mainnet addresses start with 'G'
  // Testnet addresses start with 'T' (though testnet can also use 'G', we check the actual network)
  // For validation purposes, we check if it's a valid address and then verify on the network
  if (network === "MAINNET") {
    return firstChar === "G";
  } else if (network === "TESTNET") {
    // Testnet can have addresses starting with 'G' or 'T'
    // We'll verify existence on the network instead of just prefix
    return firstChar === "G" || firstChar === "T";
  }

  return false;
}

export { StrKey };

/**
 * Validates that an account exists on the specified network
 * @param address - The Stellar address to check
 * @param network - The network to check on ('MAINNET' or 'TESTNET')
 * @returns Promise resolving to true if account exists, false if not found, or throws on network error
 */
export async function checkAccountExists(
  address: string,
  network: Network,
): Promise<boolean> {
  if (!address || typeof address !== "string") {
    return false;
  }

  const cleaned = address.trim().toUpperCase();

  try {
    // Create server instance for the appropriate network
    const serverUrl =
      network === "MAINNET"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org";

    const server = new Horizon.Server(serverUrl);

    // Attempt to load the account
    // This will throw an error if the account doesn't exist (404)
    await server.loadAccount(cleaned);

    return true;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    // If it's a 404, the account doesn't exist
    if (err?.response?.status === 404) {
      return false;
    }

    // For other errors (network issues, etc.), rethrow
    throw error;
  }
}

export { Horizon as HorizonServer };

/**
 * Comprehensive validation of a Stellar address with network-specific checks
 * @param address - The Stellar address to validate
 * @param network - The expected network ('MAINNET' or 'TESTNET')
 * @returns Promise resolving to ValidationResult
 */
export async function validateStellarAddress(
  address: string,
  network: Network,
): Promise<ValidationResult> {
  // Step 1: Validate format
  if (!validateStellarAddressFormat(address)) {
    return { valid: false, error: "invalid-format" };
  }

  const cleaned = address.trim().toUpperCase();

  // Step 2: Check network prefix (basic check)
  // For mainnet, must start with 'G'
  if (network === "MAINNET" && cleaned.charAt(0) !== "G") {
    return { valid: false, error: "wrong-network" };
  }

  // Step 3: Check account existence on the network
  try {
    const exists = await checkAccountExists(cleaned, network);
    if (!exists) {
      return { valid: false, error: "not-found" };
    }
  } catch {
    // Network error or other error during account check
    return { valid: false, error: "network-error" };
  }

  // All checks passed
  return { valid: true, network };
}

export default validateStellarAddress;
