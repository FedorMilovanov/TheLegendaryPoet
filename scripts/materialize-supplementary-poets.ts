import { materializeSupplementaryPoets } from './supplementary-poet-artifacts';

const flags = process.argv.slice(2);
if (flags.length !== 1 || !['--check', '--write'].includes(flags[0])) {
  throw new Error('Usage: tsx scripts/materialize-supplementary-poets.ts --check|--write');
}
materializeSupplementaryPoets(flags[0] === '--check');
