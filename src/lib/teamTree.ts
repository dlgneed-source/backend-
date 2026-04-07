export type TeamTreeMode = 'Level 1' | 'Downline';

export interface TeamTreeApiNode {
  id: string;
  walletAddress: string;
  name: string | null;
  level: number;
  enrollmentCount: number;
  children?: TeamTreeApiNode[] | null;
}

export interface ReferralDisplayNode {
  id: string;
  name: string;
  wallet: string;
  level: number;
  children: ReferralDisplayNode[];
}

interface TeamStatsPayload {
  totalMembers?: number | null;
  level1Count?: number | null;
  level2Count?: number | null;
}

const toSafeCount = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) return 0;
  return Math.trunc(value);
};

export const formatWalletAddress = (walletAddress?: string | null): string => {
  if (!walletAddress) return '—';
  if (walletAddress.length <= 12) return walletAddress;
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

export const mapTeamTreeNodes = (nodes?: TeamTreeApiNode[] | null): ReferralDisplayNode[] => {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  return nodes.map((node) => {
    const children = mapTeamTreeNodes(node.children ?? []);
    return {
      id: node.id,
      name: node.name?.trim() || formatWalletAddress(node.walletAddress),
      wallet: formatWalletAddress(node.walletAddress),
      level: toSafeCount(node.level),
      children,
    };
  });
};

export const buildReferralRootNode = ({
  rootId,
  rootName,
  rootWallet,
  nodes,
  mode,
}: {
  rootId: string;
  rootName?: string | null;
  rootWallet?: string | null;
  nodes?: TeamTreeApiNode[] | null;
  mode: TeamTreeMode;
}): ReferralDisplayNode => {
  const children = mapTeamTreeNodes(nodes);
  const displayChildren =
    mode === 'Level 1'
      ? children.map((child) => ({
          ...child,
          children: [],
        }))
      : children;

  return {
    id: rootId,
    name: rootName?.trim() || 'You',
    wallet: formatWalletAddress(rootWallet),
    level: 0,
    children: displayChildren,
  };
};

export const hasNestedDownline = (nodes: ReferralDisplayNode[]): boolean =>
  nodes.some((node) => node.children.length > 0 || hasNestedDownline(node.children));

export const mapTeamStatsCounts = (stats?: TeamStatsPayload | null) => ({
  level1: toSafeCount(stats?.level1Count),
  level2: toSafeCount(stats?.level2Count),
  total: toSafeCount(stats?.totalMembers),
});
