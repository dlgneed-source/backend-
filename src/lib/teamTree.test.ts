import {
  buildReferralRootNode,
  hasNestedDownline,
  mapTeamStatsCounts,
  mapTeamTreeNodes,
  type TeamTreeApiNode,
} from '@/lib/teamTree';

describe('teamTree mapping', () => {
  it('maps nested API tree to display tree', () => {
    const apiTree: TeamTreeApiNode[] = [
      {
        id: 'l1-a',
        walletAddress: '0x1111111111111111111111111111111111111111',
        name: 'Alice',
        level: 1,
        enrollmentCount: 1,
        children: [
          {
            id: 'l2-a',
            walletAddress: '0x2222222222222222222222222222222222222222',
            name: 'Bob',
            level: 2,
            enrollmentCount: 1,
            children: [],
          },
        ],
      },
    ];

    const mapped = mapTeamTreeNodes(apiTree);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].name).toBe('Alice');
    expect(mapped[0].children).toHaveLength(1);
    expect(mapped[0].children[0].name).toBe('Bob');
  });

  it('handles empty response', () => {
    expect(mapTeamTreeNodes([])).toEqual([]);
    expect(mapTeamTreeNodes(undefined)).toEqual([]);
  });

  it('handles partial/incomplete hierarchy', () => {
    const partialTree = [
      {
        id: 'l1-a',
        walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        name: null,
        level: 1,
        enrollmentCount: 0,
      },
    ] as TeamTreeApiNode[];

    const mapped = mapTeamTreeNodes(partialTree);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].children).toEqual([]);
    expect(mapped[0].name).toMatch(/^0xaaaa\.\.\.aaaa$/);
  });
});

describe('teamTree derived states', () => {
  it('supports level1-only and downline root mapping', () => {
    const apiTree: TeamTreeApiNode[] = [
      {
        id: 'l1-a',
        walletAddress: '0x1111111111111111111111111111111111111111',
        name: 'Alice',
        level: 1,
        enrollmentCount: 0,
        children: [
          {
            id: 'l2-a',
            walletAddress: '0x2222222222222222222222222222222222222222',
            name: 'Bob',
            level: 2,
            enrollmentCount: 0,
            children: [],
          },
        ],
      },
    ];

    const levelOneRoot = buildReferralRootNode({
      rootId: 'self',
      rootName: 'You',
      rootWallet: '0xffffffffffffffffffffffffffffffffffffffff',
      nodes: apiTree,
      mode: 'Level 1',
    });
    const downlineRoot = buildReferralRootNode({
      rootId: 'self',
      rootName: 'You',
      rootWallet: '0xffffffffffffffffffffffffffffffffffffffff',
      nodes: apiTree,
      mode: 'Downline',
    });

    expect(levelOneRoot.children[0].children).toEqual([]);
    expect(downlineRoot.children[0].children).toHaveLength(1);
    expect(hasNestedDownline(downlineRoot.children)).toBe(true);
  });

  it('maps stats counts safely', () => {
    expect(mapTeamStatsCounts({ totalMembers: 12, level1Count: 3, level2Count: 4 })).toEqual({
      total: 12,
      level1: 3,
      level2: 4,
    });

    expect(mapTeamStatsCounts({ totalMembers: null, level1Count: -2, level2Count: undefined })).toEqual({
      total: 0,
      level1: 0,
      level2: 0,
    });
  });
});
