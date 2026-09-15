# Midnight Level 1 — Private Eligibility Proof

A minimal **Midnight Network** smart contract demonstrating how a private input can be used inside a zero-knowledge circuit while exposing only a deliberate public result.

---

## Contract Address

| Network                    | Contract Address           |
| -------------------------- | -------------------------- |
| Midnight Preview / Preprod | `TBD — deployment pending` |

> The contract address will be added after successful deployment to the Midnight Preview or Preprod network.

---

## What This Does

This project implements a simple privacy-preserving eligibility verifier using **Compact** on the Midnight Network.

The `proveEligibility` circuit receives a private numeric value and checks whether it is greater than or equal to `18`.

The blockchain stores only the resulting boolean value:

* `true` → the private value meets the eligibility requirement.
* `false` → the private value does not meet the eligibility requirement.

The original private value is **not stored in the public ledger**.

### Example

Suppose a user has the private value:

```text
21
```

The circuit evaluates:

```text
21 >= 18
```

The public result becomes:

```text
eligible = true
```

An observer can see that the user is eligible, but the underlying value `21` is not intentionally disclosed by the circuit.

---

# Privacy Model

The contract demonstrates three important concepts:

## PUBLIC

The following value is stored on the blockchain:

```compact
eligible: Boolean
```

This means anyone observing the public contract state can determine whether the eligibility condition evaluated to `true` or `false`.

---

## PRIVATE

The circuit receives:

```compact
secretValue: Uint<16>
```

This value represents the user's private input.

It is used inside the zero-knowledge circuit and is **not written to the public ledger**.

---

## PROVES

The circuit deliberately discloses only the final eligibility result:

```compact
eligible = disclose(secretValue >= threshold);
```

The circuit therefore separates:

```text
PRIVATE INPUT
     │
     ▼
secretValue
     │
     ▼
Zero-Knowledge Circuit
     │
     │  secretValue >= 18
     ▼
PUBLIC RESULT
     │
     ▼
eligible = true / false
```

The goal is to reveal only the information required by the application.

---

# Smart Contract

The Compact contract is located at:

```text
contracts/hello-world.compact
```

The main circuit is:

```text
proveEligibility(secretValue)
```

The eligibility threshold is:

```text
18
```

The contract uses:

```compact
pragma language_version >= 0.21;

import CompactStandardLibrary;

export ledger eligible: Boolean;

export circuit proveEligibility(secretValue: Uint<16>): [] {
    const threshold: Uint<16> = 18;

    eligible = disclose(secretValue >= threshold);
}
```

---

# Circuit Compilation

The project uses the Midnight Compact compiler.

Compile the contract with:

```bash
npm run compile
```

Expected output:

```text
Compiling 1 circuits:
  circuit "proveEligibility" (k=9, rows=56)
```

The compiler generates the managed contract artifacts under:

```text
contracts/managed/eligibility/
```

Generated artifacts include:

```text
contracts/managed/eligibility/
├── compiler/
│   └── contract-info.json
├── contract/
│   ├── index.d.ts
│   ├── index.js
│   └── index.js.map
├── keys/
│   ├── proveEligibility.prover
│   └── proveEligibility.verifier
└── zkir/
    ├── proveEligibility.bzkir
    └── proveEligibility.zkir
```

These generated files contain the compiled contract interface, proving/verifying keys, and zero-knowledge circuit artifacts required by the Midnight tooling.

---

# Tests

The project includes tests covering the core Level 1 requirements.

Run:

```bash
npm test
```

Expected result:

```text
✔ circuit logic: values below 18 are not eligible
✔ circuit logic: values at or above 18 are eligible
✔ state transition: public state contains only eligibility
✔ private input is not exposed by the generated contract interface

ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Test Coverage

### 1. Circuit Logic — Below Threshold

Verifies that:

```text
17 >= 18
```

evaluates to:

```text
false
```

### 2. Circuit Logic — Meets Threshold

Verifies that:

```text
18 >= 18
```

evaluates to:

```text
true
```

### 3. Public State Transition

Verifies that the public state contains the eligibility result without storing the private input.

### 4. Private Input Protection

Checks the generated contract metadata to verify that `secretValue` is represented as a circuit input while the circuit result contains no private value.

> These tests validate the circuit logic, state model, and generated contract metadata. Full on-chain proof execution is performed during deployment/runtime.

---

# CLI

The project includes an interactive command-line interface.

Start it with:

```bash
npm run cli
```

The CLI provides:

```text
1. Prove eligibility privately
2. Read public eligibility result
3. Check wallet balance
4. Exit
```

## Prove Eligibility

The user can enter a private value:

```text
Enter your private value:
```

The CLI validates that the value is an integer between:

```text
0 — 65535
```

The value is then supplied to:

```text
proveEligibility(secretValue)
```

The CLI displays the resulting public eligibility status without intentionally publishing the original private input.

---

# Project Structure

```text
midnight-level1/
│
├── contracts/
│   ├── hello-world.compact
│   └── managed/
│       └── eligibility/
│           ├── compiler/
│           ├── contract/
│           ├── keys/
│           └── zkir/
│
├── src/
│   ├── check-balance.ts
│   ├── cli.ts
│   ├── deploy.ts
│   ├── network.ts
│   ├── setup.ts
│   ├── wallet-state.ts
│   └── wallet.ts
│
├── tests/
│   └── eligibility.test.ts
│
├── scripts/
│   ├── clean.mjs
│   └── e2e-check.ts
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

# Tech Stack

| Technology           | Purpose                             |
| -------------------- | ----------------------------------- |
| **Midnight Network** | Privacy-focused blockchain platform |
| **Compact**          | Midnight smart contract language    |
| **Compact Compiler** | Compiles Compact circuits           |
| **Midnight.js**      | Contract deployment and interaction |
| **Node.js 22**       | JavaScript/TypeScript runtime       |
| **TypeScript**       | CLI and deployment code             |
| **Docker**           | Local proof-server infrastructure   |
| **WSL2**             | Linux development environment       |
| **Node Test Runner** | Automated tests                     |

---

# Prerequisites

Before running the project, install:

* Node.js 22+
* npm
* Docker Desktop
* WSL2
* Midnight Compact compiler
* Git

Verify the installed tools:

```bash
node --version
npm --version
docker --version
compact --version
```

The project was developed using:

```text
Node.js: 22.x
Compact Devtools: 0.5.2
Compact Language Version: 0.21.0
Docker: 29.x
```

---

# Installation

Clone the repository:

```bash
git clone <YOUR_PUBLIC_REPOSITORY_URL>
```

Enter the project:

```bash
cd midnight-level1
```

Install dependencies:

```bash
npm install
```

---

# Compile the Contract

Run:

```bash
npm run compile
```

Expected output:

```text
Compiling 1 circuits:
  circuit "proveEligibility" (k=9, rows=56)
```

The generated contract artifacts will appear in:

```text
contracts/managed/eligibility/
```

---

# Run Tests

Run:

```bash
npm test
```

A successful run should report:

```text
tests 4
pass 4
fail 0
```

---

# Local Proof Server

The project includes Docker configuration for the Midnight proof server.

Start it with:

```bash
npm run proof-server:start
```

Stop it with:

```bash
npm run proof-server:stop
```

The proof server is configured through:

```text
docker-compose.yml
```

---

# Deployment

The project includes deployment tooling in:

```text
src/deploy.ts
```

The deployment configuration supports the Midnight network configuration used by the scaffold.

Before deployment, ensure that:

1. Docker is running.
2. The required proof server is available.
3. The wallet is configured.
4. The wallet has sufficient testnet funds.
5. The contract has been compiled successfully.

Compile first:

```bash
npm run compile
```

Then deploy using the project's deployment command:

```bash
npm run deploy
```

After successful deployment, the resulting contract address should be added to the **Contract Address** section of this README.

---

# Initial Product Idea

## Privacy-Preserving Age and Eligibility Verification

This prototype can evolve into a privacy-preserving eligibility verification service.

For example, a user could prove that they satisfy an age requirement without revealing their exact age.

Instead of submitting sensitive personal information directly to an application, the user would provide the information privately to a zero-knowledge circuit.

The circuit would verify the required condition and disclose only the result.

For example:

```text
Private information:
Exact age = 21
       │
       ▼
Zero-Knowledge Proof
       │
       ▼
Public result:
Age requirement satisfied = YES
```

The same approach could later be extended to other eligibility checks such as:

* Minimum income requirements
* Account balance thresholds
* Membership requirements
* Qualification criteria
* Access-control conditions
* Proof of meeting an age requirement

The core product principle is:

> **Prove what is necessary without revealing more information than necessary.**

---

# Why Midnight?

Traditional blockchain applications make public state highly visible.

If an application needs to verify sensitive information, directly putting that information on-chain can expose more data than necessary.

Midnight's privacy-oriented architecture allows applications to use private inputs in zero-knowledge computations while selectively disclosing results.

This project demonstrates that basic model with a simple eligibility condition.

---

# Screenshots

## Successful Compilation

The Compact contract compiled successfully with the `proveEligibility` circuit:

```text
npm run compile

Compiling 1 circuits:
  circuit "proveEligibility" (k=9, rows=56)
```

**Screenshot:**

![Successful Compact compilation](screenshots/compile-success.png)

---

## Deployed Contract

The contract was successfully deployed to the **Midnight Preview network**.

**Contract Address:**

```text
4274fd6ef6ed5e3b7de35f5303a410a166823739e580473d447f7302d69ebf10
```

**Deployment screenshot:**

![Successful contract deployment](screenshots/deployment-success.png)

---


# Level 1 Challenge Checklist

| Requirement                          | Status |
| ------------------------------------ | ------ |
| Node.js 22 installed                 | ✅      |
| Docker available                     | ✅      |
| Compact compiler installed           | ✅      |
| Compact contract created             | ✅      |
| Public ledger state implemented      | ✅      |
| Private circuit input implemented    | ✅      |
| Deliberate `disclose()` demonstrated | ✅      |
| Contract compiles                    | ✅      |
| `proveEligibility` circuit generated | ✅      |
| `managed/` artifacts generated       | ✅      |
| Test suite created                   | ✅      |
| Tests pass                           | ✅      |
| Privacy model documented             | ✅      |
| Initial product idea documented      | ✅      |
| Preview/Preprod deployment           | ⬜      |
| Contract address added               | ⬜      |
| Compilation screenshot               | ⬜      |
| Deployment screenshot                | ⬜      |
| Public GitHub repository             | ⬜      |
| Minimum 5 meaningful commits         | ⬜      |

---

# Learning Outcome

This Level 1 project demonstrates the basic workflow of building a privacy-oriented application on Midnight:

```text
Write Compact Contract
        │
        ▼
Compile Circuit
        │
        ▼
Generate ZK Artifacts
        │
        ▼
Provide Private Input
        │
        ▼
Execute Zero-Knowledge Circuit
        │
        ▼
Disclose Only Required Result
        │
        ▼
Store Public Result
```

The key concept demonstrated by this project is that **private information can be used to produce a verifiable public result without making the underlying information part of the public state**.

---

# License

This project is created as part of the Midnight Builder Challenge.

License: MIT

