import { essays } from '../src/data/essays/index';

const errors: string[] = [];
const warnings: string[] = [];
const essayById = new Map(essays.map((essay) => [essay.id, essay]));
const clusterLabels = new Map<string, string>();
const clusterOrders = new Map<string, Map<number, string>>();

for (const essay of essays) {
  if (essay.seoTitle && essay.seoTitle.length > 85) {
    warnings.push(`${essay.slug}: seoTitle is ${essay.seoTitle.length} characters; review SERP truncation`);
  }
  if (essay.seoDescription) {
    if (essay.seoDescription.length < 115) {
      warnings.push(`${essay.slug}: seoDescription is short (${essay.seoDescription.length} characters)`);
    }
    if (essay.seoDescription.length > 180) {
      warnings.push(`${essay.slug}: seoDescription is long (${essay.seoDescription.length} characters)`);
    }
  }

  const relatedIds = essay.relatedEssayIds ?? [];
  const localIds = new Set<string>();
  for (const relatedId of relatedIds) {
    if (relatedId === essay.id) errors.push(`${essay.slug}: cannot relate to itself`);
    if (localIds.has(relatedId)) errors.push(`${essay.slug}: duplicate related essay id ${relatedId}`);
    localIds.add(relatedId);
    if (!essayById.has(relatedId)) errors.push(`${essay.slug}: missing related essay id ${relatedId}`);
  }

  if (!essay.cluster) continue;
  const knownLabel = clusterLabels.get(essay.cluster.id);
  if (knownLabel && knownLabel !== essay.cluster.label) {
    errors.push(`${essay.slug}: cluster ${essay.cluster.id} uses label “${essay.cluster.label}”, expected “${knownLabel}”`);
  } else {
    clusterLabels.set(essay.cluster.id, essay.cluster.label);
  }

  if (essay.cluster.order !== undefined) {
    const orders = clusterOrders.get(essay.cluster.id) ?? new Map<number, string>();
    const existing = orders.get(essay.cluster.order);
    if (existing) {
      errors.push(`${essay.slug}: cluster order ${essay.cluster.order} duplicates ${existing}`);
    }
    orders.set(essay.cluster.order, essay.slug);
    clusterOrders.set(essay.cluster.id, orders);
  }

  if (!essay.seoTitle) errors.push(`${essay.slug}: clustered essay requires seoTitle`);
  if (!essay.seoDescription) errors.push(`${essay.slug}: clustered essay requires seoDescription`);
  if (!essay.seoKeywords || essay.seoKeywords.length < 3) {
    errors.push(`${essay.slug}: clustered essay requires at least 3 seoKeywords`);
  }
  if (relatedIds.length < 2) {
    errors.push(`${essay.slug}: clustered essay requires at least 2 explicit relatedEssayIds`);
  }
}

for (const [clusterId, label] of clusterLabels) {
  const members = essays.filter((essay) => essay.cluster?.id === clusterId);
  if (members.length < 3) {
    warnings.push(`${clusterId} (${label}): only ${members.length} members; cluster navigation may be thin`);
  }

  for (const member of members) {
    const reciprocalClusterLinks = (member.relatedEssayIds ?? []).filter((id) =>
      members.some((candidate) => candidate.id === id),
    );
    if (reciprocalClusterLinks.length < 2) {
      errors.push(`${member.slug}: needs at least 2 links to other members of cluster ${clusterId}`);
    }
  }
}

const mayakovskyCluster = essays.filter(
  (essay) => essay.cluster?.id === 'mayakovsky-life-texts-archive',
);
const requiredMayakovskySlugs = [
  'mayakovsky-before-revolution',
  'mayakovsky-gromovoy',
  'mayakovsky-pro-eto-separation',
  'brik-case',
];
for (const slug of requiredMayakovskySlugs) {
  if (!mayakovskyCluster.some((essay) => essay.slug === slug)) {
    errors.push(`Mayakovsky cluster is missing required essay ${slug}`);
  }
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(
  `Topic cluster validation: ${clusterLabels.size} clusters, ${essays.length} essays, ${errors.length} errors, ${warnings.length} warnings`,
);

if (errors.length > 0) process.exit(1);
