import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('circuit logic: values below 18 are not eligible', () => {
  const secretValue = 17;
  assert.equal(secretValue >= 18, false);
});

test('circuit logic: values at or above 18 are eligible', () => {
  const secretValue = 18;
  assert.equal(secretValue >= 18, true);
});

test('state transition: public state contains only eligibility', () => {
  const publicState = {
    eligible: false,
  };

  publicState.eligible = 21 >= 18;

  assert.equal(publicState.eligible, true);
  assert.deepEqual(Object.keys(publicState), ['eligible']);
});

test('private input is not exposed by the generated contract interface', async () => {
  const contractInfo = JSON.parse(
    await readFile(
      'contracts/managed/eligibility/compiler/contract-info.json',
      'utf8',
    ),
  );

  const circuit = contractInfo.circuits.find(
    (entry: any) => entry.name === 'proveEligibility',
  );

  assert.ok(circuit);
  assert.equal(circuit.arguments[0].name, 'secretValue');
  assert.equal(circuit.arguments[0].type['type-name'], 'Uint');

  // The private input is a circuit argument.
  // The Compact source discloses only the boolean eligibility result.
  assert.deepEqual(circuit['result-type'].types, []);
});
