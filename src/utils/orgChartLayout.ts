import dagre from 'dagre';
import type { OrgChartNode } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;

// Positions every node as a top-down tree by parentId, ignoring any x/y
// already stored on the nodes. Used for the initial seed and the
// "auto arrange" toolbar action; manual drags afterward simply overwrite x/y.
export function autoLayoutOrgChart(nodes: OrgChartNode[]): OrgChartNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 70 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const node of nodes) {
    if (node.parentId && nodes.some((n) => n.id === node.parentId)) {
      g.setEdge(node.parentId, node.id);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return pos ? { ...node, x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } : node;
  });
}
