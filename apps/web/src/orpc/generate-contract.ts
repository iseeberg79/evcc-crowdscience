import fs from "node:fs";
import path from "node:path";
import { minifyContractRouter } from "@orpc/contract";

import { router } from "./router";

const minifiedContract = minifyContractRouter(router);

// Write to src directory so it can be imported by the client
const outputPath = path.join(process.cwd(), "src", "orpc", "contract.json");
fs.writeFileSync(outputPath, JSON.stringify(minifiedContract, null, 2));

console.log(`✓ Contract JSON generated at ${outputPath}`);
