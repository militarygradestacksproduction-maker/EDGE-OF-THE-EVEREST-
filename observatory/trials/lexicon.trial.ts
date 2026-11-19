import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// The Lexicon Trials.
//
// The doctrine claims that the Observatory surface speaks the Divine Celestial
// Lexicon and nothing else, and that no forbidden mortal term appears on a
// public surface. These trials read the published source and hold it to that
// claim. They are static by necessity: the Seer is a React Three Fiber
// component and cannot be mounted in a node environment, so its *interface
// strings* are what is verified here — which is exactly what the doctrine
// makes a claim about.
// ---------------------------------------------------------------------------

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');

const seer = read('observatory/TheRealitySeer.tsx');
const doctrine = read('THE-CELESTIAL-MIND.md');
const specs = read('DIVINE_SPECIFICATIONS.md');
const readme = read('README.md');

// "system state" is forbidden as *prose*. It is required in the left column of
// the lexicon mapping table, which exists precisely to define the replacement.
// So the scan strips the table rows before looking for the term.
const stripLexiconTable = (doc: string) =>
  doc
    .split('\n')
    .filter((line) => !/^\|\s*system state\s*\|/i.test(line.trim()))
    .join('\n');

const FORBIDDEN = [
  { term: 'Founder', re: /\bfounder\b/i },
  { term: 'sundering', re: /\bsundering\b/i },
  { term: 'fading', re: /\bfading\b/i },
  { term: 'system state', re: /\bsystem\s+state\b/i, stripTable: true },
];

describe('the forbidden tongue is absent from every public surface', () => {
  for (const { term, re, stripTable } of FORBIDDEN) {
    const clean = (doc: string) => (stripTable ? stripLexiconTable(doc) : doc);
    it(`the Seer contains no "${term}"`, () => {
      expect(clean(seer)).not.toMatch(re);
    });
    it(`the doctrine contains no "${term}"`, () => {
      expect(clean(doctrine)).not.toMatch(re);
    });
    it(`the specifications contain no "${term}"`, () => {
      expect(clean(specs)).not.toMatch(re);
    });
    it(`the README contains no "${term}"`, () => {
      expect(clean(readme)).not.toMatch(re);
    });
  }

  it('the lexicon table is the only place "system state" appears', () => {
    // Proves the strip above is not hiding a real violation: exactly one row.
    const rows = (doc: string) =>
      doc.split('\n').filter((l) => /^\|\s*system state\s*\|/i.test(l.trim()));
    expect(rows(doctrine)).toHaveLength(1);
    expect(rows(readme)).toHaveLength(1);
    expect(rows(seer)).toHaveLength(0);
  });

  it('"runtime" is never used as a primary noun in the Seer', () => {
    // The lexicon permits the word only inside the mapping table that defines
    // it. The Seer is not a table, so it may not contain the word at all.
    expect(seer).not.toMatch(/\bruntime\b/i);
  });
});

describe('the Seer speaks the celestial register', () => {
  const REQUIRED_INTERFACE_TERMS = [
    'THE THRONE',
    'THRONE GUARD',
    'CELESTIAL PATH',
    'THE RIFT',
    'WITHERING',
    'Sovereign Current',
    'EYE OF THE CROWN',
    'CELESTIAL CHRONICLE',
    'THE FIRMAMENT',
    'CONTINUUM',
    'STARS',
  ];

  for (const term of REQUIRED_INTERFACE_TERMS) {
    it(`renders "${term}"`, () => {
      expect(seer).toContain(term);
    });
  }

  it('names the shell ASGARD // CELESTIAL OS', () => {
    expect(seer).toContain('ASGARD // CELESTIAL OS');
  });

  it('labels the projection panel THE CELESTIAL PROJECTION', () => {
    expect(seer).toContain('THE CELESTIAL PROJECTION');
  });

  it('renders the Throne as THE THRONE, never as a kernel', () => {
    expect(seer).toMatch(/id === 'KERNEL' \? 'THE THRONE'/);
  });
});

describe('the component register is celestial', () => {
  const COMPONENTS = [
    'AstralHost',
    'AstralCluster',
    'ThroneGuardField',
    'CelestialPaths',
    'RiftFracture',
    'DominionSeat',
    'SovereignMark',
    'CelestialHelm',
    'EyeOfTheCrown',
    'TheFirmament',
  ];

  for (const c of COMPONENTS) {
    it(`declares ${c}`, () => {
      expect(seer).toMatch(new RegExp(`function ${c}\\b`));
    });
  }

  it('keeps TheRealitySeer as the default export', () => {
    expect(seer).toMatch(/export default function TheRealitySeer/);
  });
});

describe('the doctrine and the Seer agree on the lexicon', () => {
  it('the doctrine carries the full mapping table', () => {
    const rows = [
      ['runtime', 'the celestial engine'],
      ['district', 'realm / dominion'],
      ['knowledge object', 'star'],
      ['agent', 'Throne Guard'],
      ['route / conduit', 'Celestial Path'],
      ['stale', 'withering'],
      ['budget', 'Sovereign Current'],
      ['causal rupture', 'the Rift'],
      ['epistemic decay', 'the Withering'],
      ['inspector', 'Eye of the Crown'],
      ['event feed', 'the Celestial Chronicle'],
      ['overview', 'the Firmament'],
      ['kernel', 'the Throne'],
      ['system state', 'Continuum'],
    ];
    for (const [mortal, celestial] of rows) {
      expect(doctrine.toLowerCase()).toContain(mortal);
      expect(doctrine.toLowerCase()).toContain(celestial.toLowerCase());
    }
  });

  it('the README carries the same table', () => {
    expect(readme).toContain('Sovereign Current');
    expect(readme).toContain('the Celestial Chronicle');
    expect(readme).toContain('Continuum');
  });
});
