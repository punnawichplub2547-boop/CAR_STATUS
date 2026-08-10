import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
  type NodeChange,
  type Connection,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LayoutGrid, Trash2, User, X } from 'lucide-react';
import type { OrgChartNode, OrgChartLevel, Employee } from '../types';
import { autoLayoutOrgChart } from '../utils/orgChartLayout';

// The real position tags from F-HR-038 (CAR's actual org chart file),
// ordered senior-to-junior. Badge color groups them into rough tiers —
// mgmt (red), senior support/supervisory (amber), mid support (blue),
// junior/operational (green). MD/GM carry no tag in the source file
// either, so this stays optional on OrgChartNode (see types/index.ts).
const ORG_LEVELS: { value: OrgChartLevel; label: string; badgeClass: string }[] = [
  { value: 'mgr', label: 'Mgr. (ผู้จัดการ)', badgeClass: 'badge-red' },
  { value: 'asst_mgr', label: 'Asst. Mgr. (ผู้ช่วยผู้จัดการ)', badgeClass: 'badge-red' },
  { value: 'sr_sv', label: 'Sr. SV (หัวหน้างานอาวุโส)', badgeClass: 'badge-amber' },
  { value: 'sr_officer', label: 'Sr. Officer (เจ้าหน้าที่อาวุโส)', badgeClass: 'badge-amber' },
  { value: 'sr_engineer', label: 'Sr. Engineer (วิศวกรอาวุโส)', badgeClass: 'badge-amber' },
  { value: 'leader', label: 'Leader (หัวหน้าทีม)', badgeClass: 'badge-amber' },
  { value: 'sv', label: 'SV (หัวหน้างาน)', badgeClass: 'badge-blue' },
  { value: 'sub_leader', label: 'Sub Leader (รองหัวหน้าทีม)', badgeClass: 'badge-blue' },
  { value: 'engineer', label: 'Engineer (วิศวกร)', badgeClass: 'badge-blue' },
  { value: 'officer', label: 'Officer (เจ้าหน้าที่)', badgeClass: 'badge-green' },
  { value: 'tech', label: 'Tech (ช่างเทคนิค)', badgeClass: 'badge-green' },
  { value: 'secretary', label: 'Secretary (เลขานุการ)', badgeClass: 'badge-green' },
  { value: 'asst_secretary', label: 'Asst. Secretary (ผู้ช่วยเลขานุการ)', badgeClass: 'badge-green' },
];

function levelInfo(level?: OrgChartLevel) {
  return ORG_LEVELS.find((l) => l.value === level);
}

interface OrgChartBuilderProps {
  nodes: OrgChartNode[];
  onChange: (nodes: OrgChartNode[]) => void;
  employees: Employee[];
}

// The app's light/dark toggle (Navbar.tsx) sets data-theme on <html> directly,
// with no React context. React Flow's own light/dark styling (Controls,
// MiniMap, Background) is separate and defaults to light regardless — without
// this, those widgets render with white/light chrome even in dark mode.
function useColorMode(): 'light' | 'dark' {
  const [mode, setMode] = useState<'light' | 'dark'>(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setMode(target.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    });
    observer.observe(target, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return mode;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type BoxData = {
  name: string;
  title: string;
  department?: string;
  level?: OrgChartLevel;
};

function OrgBox({ data, selected }: NodeProps<Node<BoxData>>) {
  const level = levelInfo(data.level);
  return (
    <div
      className="glass-card"
      style={{
        width: 220,
        padding: 14,
        textAlign: 'left',
        border: selected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
        cursor: 'grab',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 16, height: 16, background: 'var(--primary)', border: '2px solid var(--bg-card)' }}
      />
      <div
        style={{
          fontWeight: 700,
          fontSize: '0.85rem',
          fontStyle: data.name ? 'normal' : 'italic',
          color: data.name ? undefined : 'var(--text-muted)',
        }}
        title={data.name || '(ยังไม่ระบุชื่อ)'}
      >
        {data.name ? truncate(data.name, 40) : '(ยังไม่ระบุชื่อ — คลิกเพื่อตั้งชื่อ)'}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }} title={data.title}>
        {truncate(data.title, 40)}
      </div>
      {(level || data.department) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {level && <span className={`badge ${level.badgeClass}`}>{level.label}</span>}
          {data.department && <span className="badge badge-blue">{data.department}</span>}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 16, height: 16, background: 'var(--primary)', border: '2px solid var(--bg-card)' }}
      />
    </div>
  );
}

const nodeTypes = { orgBox: OrgBox };

// `measured` (each box's actual rendered width/height) isn't part of
// OrgChartNode — it's React Flow's own bookkeeping, reported back via
// 'dimensions' changes in handleNodesChange and merged in here. Without it,
// toFlowNodes hands React Flow a fresh, dimension-less node object on every
// change, so it never considers a node "initialized" and drags/connects
// starting from it can silently misfire (React Flow error #015).
function toFlowNodes(
  nodes: OrgChartNode[],
  measuredById: Record<string, { width: number; height: number }>
): Node<BoxData>[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'orgBox',
    position: { x: n.x, y: n.y },
    measured: measuredById[n.id],
    data: {
      name: n.name,
      title: n.title,
      department: n.department,
      level: n.level,
    },
  }));
}

type SelectedEdge = { id: string; targetId: string };
type EdgeData = { onDelete: () => void };

// Connector line with a small × button at its midpoint — appears once the
// line is selected (clicked), so cutting a reporting line doesn't require
// reaching for the toolbar or knowing the Delete key shortcut.
function OrgEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<Edge<EdgeData>>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan"
            title="ตัดสายนี้"
            onClick={(e) => {
              e.stopPropagation();
              data?.onDelete();
            }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              border: '2px solid var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'all',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              zIndex: 1000,
            }}
          >
            <X size={14} strokeWidth={3} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { orgEdge: OrgEdge };

function toFlowEdges(nodes: OrgChartNode[], selectedEdgeId: string | null, onCutEdge: (targetId: string) => void): Edge<EdgeData>[] {
  return nodes
    .filter((n) => n.parentId && nodes.some((p) => p.id === n.parentId))
    .map((n) => {
      const id = `${n.parentId}-${n.id}`;
      const isSelected = id === selectedEdgeId;
      return {
        id,
        source: n.parentId as string,
        target: n.id,
        type: 'orgEdge',
        selected: isSelected,
        data: { onDelete: () => onCutEdge(n.id) },
        markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' },
        style: { stroke: isSelected ? 'var(--primary)' : 'var(--text-muted)', strokeWidth: isSelected ? 3 : 2 },
      };
    });
}

// True if `candidateParentId` is currently a descendant of `nodeId` — i.e.
// pointing nodeId's edge at it would fold the tree back on itself.
function wouldCreateCycle(nodes: OrgChartNode[], candidateParentId: string, nodeId: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let current: string | null = candidateParentId;
  while (current) {
    if (current === nodeId) return true;
    current = byId.get(current)?.parentId ?? null;
  }
  return false;
}

function OrgChartCanvas({ nodes, onChange, employees }: OrgChartBuilderProps) {
  const colorMode = useColorMode();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [pullOffset, setPullOffset] = useState(0);
  // See toFlowNodes — React Flow's own per-node measured size, kept outside
  // OrgChartNode and merged back in on render.
  const [measuredById, setMeasuredById] = useState<Record<string, { width: number; height: number }>>({});

  // Shared by the toolbar "ตัดเส้นที่เลือก" button and the inline × button on
  // the selected line itself — both just unlink the target box's parent.
  const handleCutEdge = useCallback(
    (targetId: string) => {
      onChange(nodes.map((n) => (n.id === targetId ? { ...n, parentId: null } : n)));
      setSelectedEdge(null);
    },
    [nodes, onChange]
  );

  const flowNodes = useMemo(() => toFlowNodes(nodes, measuredById), [nodes, measuredById]);
  const flowEdges = useMemo(
    () => toFlowEdges(nodes, selectedEdge?.id ?? null, handleCutEdge),
    [nodes, selectedEdge, handleCutEdge]
  );
  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : undefined;

  const childCount = useCallback(
    (id: string) => nodes.filter((n) => n.parentId === id).length,
    [nodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<BoxData>>[]) => {
      let next = nodes;
      let nextMeasured: Record<string, { width: number; height: number }> | null = null;
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          next = next.map((n) => (n.id === change.id ? { ...n, x: change.position!.x, y: change.position!.y } : n));
        } else if (change.type === 'dimensions' && change.dimensions) {
          nextMeasured = { ...(nextMeasured ?? measuredById), [change.id]: change.dimensions };
        }
      }
      if (next !== nodes) onChange(next);
      if (nextMeasured) setMeasuredById(nextMeasured);
    },
    [nodes, onChange, measuredById]
  );

  const handleAutoArrange = () => onChange(autoLayoutOrgChart(nodes));

  // Employees already placed on the chart (matched by name — org chart
  // nodes don't carry an employee id) are hidden from the search below, since
  // each real employee should only appear on the chart once.
  const namesOnChart = useMemo(
    () => new Set(nodes.map((n) => n.name.trim().toLowerCase()).filter(Boolean)),
    [nodes]
  );

  const employeeMatches = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter((e) => !namesOnChart.has(e.name.trim().toLowerCase()))
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [employees, employeeQuery, namesOnChart]);

  // Pulling a match drops it on the canvas as an unconnected box (parentId
  // null) — name, department, and position all come along in one pick
  // instead of being typed by hand (there's no level: Employee doesn't
  // track one). The admin then drags it into place, drags a connector to
  // its real supervisor, and adjusts anything needed from the selected-box
  // bar. Placed relative to the existing tree's bounding box (not
  // screenToFlowPosition — that needs a real viewport coordinate, and this
  // button can be clicked with the canvas scrolled/panned anywhere) so it
  // always lands just to the right of the chart instead of off in the void.
  const handlePullFromEmployee = (employee: Employee) => {
    const maxX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x)) : 0;
    const minY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) : 0;
    const newNode: OrgChartNode = {
      id: `org-custom-${Date.now()}`,
      name: employee.name,
      title: employee.position,
      department: employee.department,
      parentId: null,
      x: maxX + 320,
      y: minY + pullOffset * 170,
    };
    onChange([...nodes, newNode]);
    setSelectedId(newNode.id);
    setSelectedEdge(null);
    setPullOffset((v) => (v + 1) % 6);
    setEmployeeQuery('');
  };

  // Dragging a new line between two boxes re-points the target box's
  // reporting line at the source box (each box has exactly one parent).
  const handleConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;
      if (wouldCreateCycle(nodes, source, target)) {
        window.alert('เชื่อมไม่ได้: การเชื่อมนี้จะทำให้ผังองค์กรวนกลับมาหาตัวเอง');
        return;
      }
      onChange(nodes.map((n) => (n.id === target ? { ...n, parentId: source } : n)));
    },
    [nodes, onChange]
  );

  // Selecting a connector line and pressing Delete/Backspace cuts that
  // reporting line — the box becomes unlinked (parentId: null), not deleted.
  const handleEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const cutTargets = new Set(deleted.map((e) => e.target));
      onChange(nodes.map((n) => (cutTargets.has(n.id) ? { ...n, parentId: null } : n)));
      setSelectedEdge(null);
    },
    [nodes, onChange]
  );

  // "ลบที่เลือก" toolbar button — deletes whichever is selected: a cut line
  // (mouse-only alternative to the Delete key) or a box (blocked if it still
  // has subordinates, since deleting it would orphan their connector lines).
  const handleDeleteSelected = () => {
    if (selectedEdge) {
      handleCutEdge(selectedEdge.targetId);
      return;
    }
    if (!selectedId) return;
    if (childCount(selectedId) > 0) {
      window.alert('ลบไม่ได้: กล่องนี้ยังมีผู้ใต้บังคับบัญชาเชื่อมอยู่ กรุณาย้ายหรือลบกล่องลูกก่อน');
      return;
    }
    onChange(nodes.filter((n) => n.id !== selectedId));
    setSelectedId(null);
  };

  // Lets the level be changed after creation without reopening the add form.
  const handleChangeLevel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedId) return;
    const newLevel = (e.target.value || undefined) as OrgChartLevel | undefined;
    onChange(nodes.map((n) => (n.id === selectedId ? { ...n, level: newLevel } : n)));
  };

  // Same pattern — lets a box pulled from employee search get renamed,
  // or any other box get corrected, without a separate edit form.
  const handleChangeName = (value: string) => {
    if (!selectedId) return;
    onChange(nodes.map((n) => (n.id === selectedId ? { ...n, name: value } : n)));
  };

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>โครงสร้างองค์กร (CAR Organization Chart)</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ลากจากจุดสีน้ำเงินล่างกล่องไปวางใกล้ๆ จุดบนกล่องอื่นเพื่อเชื่อม/ย้ายสายบังคับบัญชา • คลิกเลือกเส้นแล้วกดปุ่ม × ที่กลางเส้น
            หรือปุ่ม "ลบที่เลือก" เพื่อตัดสาย
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={handleAutoArrange}>
            <LayoutGrid size={16} /> จัดเรียงอัตโนมัติ
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowEmployeeSearch((v) => !v)}
          >
            <User size={16} /> ค้นหาชื่อพนักงาน
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDeleteSelected}
            disabled={!selectedId && !selectedEdge}
            style={{ opacity: selectedId || selectedEdge ? 1 : 0.5 }}
          >
            <Trash2 size={16} /> {selectedEdge ? 'ตัดเส้นที่เลือก' : 'ลบที่เลือก'}
          </button>
        </div>
      </div>

      {showEmployeeSearch && (
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(59, 130, 246, 0.06)',
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="พิมพ์ชื่อพนักงานที่มีอยู่ในระบบ..."
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
            autoFocus
          />
          {employeeQuery.trim() && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
              {employeeMatches.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ไม่พบพนักงานที่ตรงกับคำค้นหา (หรืออยู่ในผังแล้ว)</div>
              )}
              {employeeMatches.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'block' }}
                  onClick={() => handlePullFromEmployee(employee)}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{employee.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {employee.position} • {employee.department}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            ดึงจากรายชื่อพนักงานจริงในระบบ — ชื่อ/แผนก/ตำแหน่งจะติดมาให้ครบในคลิกเดียว ไม่ต้องพิมพ์เอง
            (พนักงานที่อยู่ในผังแล้วจะไม่แสดงในรายการค้นหา) ได้กล่องลอยเหมือนกัน ลากไปวางและลากเชื่อมสายเอง
          </p>
        </div>
      )}

      {selectedNode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(59, 130, 246, 0.06)',
            flexWrap: 'wrap',
          }}
        >
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชื่อ:</label>
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: 200, padding: '4px 10px' }}
            value={selectedNode.name}
            onChange={(e) => handleChangeName(e.target.value)}
            placeholder="พิมพ์ชื่อ-นามสกุล"
          />
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ระดับตำแหน่ง:</label>
          <select
            className="form-control"
            style={{ maxWidth: 220, padding: '4px 10px' }}
            value={selectedNode.level ?? ''}
            onChange={handleChangeLevel}
          >
            <option value="">— ไม่ระบุ —</option>
            {ORG_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ height: 620, background: 'var(--bg-card)' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={colorMode}
          connectionRadius={45}
          connectionLineStyle={{ stroke: 'var(--primary)', strokeWidth: 3 }}
          onNodesChange={handleNodesChange}
          onNodeClick={(_, node) => {
            setSelectedId(node.id);
            setSelectedEdge(null);
          }}
          onEdgeClick={(_, edge) => {
            setSelectedEdge({ id: edge.id, targetId: edge.target });
            setSelectedId(null);
          }}
          onPaneClick={() => {
            setSelectedId(null);
            setSelectedEdge(null);
          }}
          onConnect={handleConnect}
          onEdgesDelete={handleEdgesDelete}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable style={{ background: 'var(--bg-card)' }} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function OrgChartBuilder(props: OrgChartBuilderProps) {
  return (
    <ReactFlowProvider>
      <OrgChartCanvas {...props} />
    </ReactFlowProvider>
  );
}
