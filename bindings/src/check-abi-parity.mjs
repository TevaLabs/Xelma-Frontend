import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CONTRACT_ABI_PATH = process.env.CONTRACT_ABI_PATH ?? path.join(ROOT, "src", "contract-abi.json");
const BINDINGS_METHOD_MAP_PATH =
  process.env.BINDINGS_METHOD_MAP_PATH ?? path.join(ROOT, "src", "bindings-method-map.json");

function toMethodRecord(value) {
  if (!value || typeof value !== "object") return null;
  const maybeMethod = value;
  if (typeof maybeMethod.name !== "string") return null;

  const rawInputs = Array.isArray(maybeMethod.inputs)
    ? maybeMethod.inputs
    : Array.isArray(maybeMethod.args)
      ? maybeMethod.args
      : [];

  const inputs = rawInputs.map((input, index) => {
    if (typeof input === "string") {
      return { name: `arg${index}`, type: input };
    }
    if (input && typeof input === "object") {
      return {
        name: typeof input.name === "string" ? input.name : `arg${index}`,
        type: typeof input.type === "string" ? input.type : "unknown",
      };
    }
    return { name: `arg${index}`, type: "unknown" };
  });

  return { name: maybeMethod.name, inputs };
}

function normalizeContractMethods(rawAbi) {
  if (Array.isArray(rawAbi)) {
    return rawAbi.map(toMethodRecord).filter(Boolean);
  }
  if (!rawAbi || typeof rawAbi !== "object") return [];

  if (Array.isArray(rawAbi.methods)) {
    return rawAbi.methods.map(toMethodRecord).filter(Boolean);
  }

  return [];
}

function normalizeBindingsMethods(rawMethodMap) {
  if (!rawMethodMap || typeof rawMethodMap !== "object") return [];

  const methods = rawMethodMap.methods && typeof rawMethodMap.methods === "object"
    ? rawMethodMap.methods
    : rawMethodMap;

  return Object.entries(methods).map(([name, value]) => {
    if (value && typeof value === "object") {
      const rawInputs = Array.isArray(value.inputs)
        ? value.inputs
        : Array.isArray(value.args)
          ? value.args
          : [];
      const inputs = rawInputs.map((input, index) => {
        if (typeof input === "string") {
          return { name: `arg${index}`, type: input };
        }
        if (input && typeof input === "object") {
          return {
            name: typeof input.name === "string" ? input.name : `arg${index}`,
            type: typeof input.type === "string" ? input.type : "unknown",
          };
        }
        return { name: `arg${index}`, type: "unknown" };
      });

      return { name, inputs };
    }

    return { name, inputs: [] };
  });
}

function signatureFor(method) {
  const args = method.inputs.map((arg) => `${arg.name}:${arg.type}`).join(", ");
  return `${method.name}(${args})`;
}

function compareMethods(contractMethods, bindingMethods) {
  const contractByName = new Map(contractMethods.map((method) => [method.name, method]));
  const bindingsByName = new Map(bindingMethods.map((method) => [method.name, method]));

  const missingInBindings = contractMethods
    .map((method) => method.name)
    .filter((methodName) => !bindingsByName.has(methodName));

  const extraInBindings = bindingMethods
    .map((method) => method.name)
    .filter((methodName) => !contractByName.has(methodName));

  const signatureMismatches = [];
  for (const [name, contractMethod] of contractByName.entries()) {
    const bindingMethod = bindingsByName.get(name);
    if (!bindingMethod) continue;

    const contractSignature = signatureFor(contractMethod);
    const bindingSignature = signatureFor(bindingMethod);
    if (contractSignature !== bindingSignature) {
      signatureMismatches.push({ name, contractSignature, bindingSignature });
    }
  }

  return { missingInBindings, extraInBindings, signatureMismatches };
}

async function parseJson(filePath) {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

function printDriftAndExit(drift) {
  console.error("ABI parity check failed.");

  if (drift.missingInBindings.length > 0) {
    console.error(`Missing in bindings: ${drift.missingInBindings.join(", ")}`);
  }
  if (drift.extraInBindings.length > 0) {
    console.error(`Extra in bindings: ${drift.extraInBindings.join(", ")}`);
  }
  if (drift.signatureMismatches.length > 0) {
    console.error("Signature mismatches:");
    for (const mismatch of drift.signatureMismatches) {
      console.error(`- ${mismatch.name}`);
      console.error(`  contract: ${mismatch.contractSignature}`);
      console.error(`  bindings: ${mismatch.bindingSignature}`);
    }
  }

  process.exit(1);
}

async function main() {
  const [rawContractAbi, rawBindingsMap] = await Promise.all([
    parseJson(CONTRACT_ABI_PATH),
    parseJson(BINDINGS_METHOD_MAP_PATH),
  ]);

  const contractMethods = normalizeContractMethods(rawContractAbi);
  const bindingMethods = normalizeBindingsMethods(rawBindingsMap);

  if (contractMethods.length === 0) {
    console.error(`No contract methods found in ${CONTRACT_ABI_PATH}`);
    process.exit(1);
  }

  const drift = compareMethods(contractMethods, bindingMethods);
  if (
    drift.missingInBindings.length > 0 ||
    drift.extraInBindings.length > 0 ||
    drift.signatureMismatches.length > 0
  ) {
    printDriftAndExit(drift);
  }

  console.log(
    `ABI parity check passed: ${contractMethods.length} contract methods match bindings method map.`
  );
}

main().catch((error) => {
  console.error("ABI parity check crashed.");
  console.error(error);
  process.exit(1);
});
