import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from 'react-flow-renderer';
import { GitBranch } from 'lucide-react';

// 読み取り専用カスタムノードコンポーネント（枠のみ）
const ReadOnlyCustomNode = ({ id, data, selected }) => {
  const isSelected = selected || data.isSelected;

  return (
    <div
      className="custom-node readonly-node"
      style={{
        backgroundColor: 'white', // 背景は常に白
        border: `3px solid ${data.color}`, // 枠の色のみ設定
        width: `${data.size}px`,
        height: `${data.size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: data.color, // テキストは枠と同じ色
        fontWeight: 'bold',
        fontSize: `${Math.max(10, data.size / 6)}px`,
        cursor: 'default',
        position: 'relative',
        boxShadow: isSelected 
          ? `0 4px 16px ${data.color}40` // 選択時は枠色でシャドウ
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        userSelect: 'none',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
        outline: 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          top: '-1px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          bottom: '-1px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0,
        }}
      />

      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 4px',
          maxWidth: '90%',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {data.label}
      </span>
    </div>
  );
};

// 読み取り専用カスタムエッジコンポーネント
const ReadOnlyCustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style, data }) => {
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      {/* エッジライン */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={`M${sourceX},${sourceY}L${targetX},${targetY}`}
        style={{
          ...style,
          stroke: data?.color || '#6B7280',
          strokeWidth: 2,
        }}
        markerEnd="url(#react-flow__arrowclosed)"
      />
      
      {/* エッジラベル */}
      {data?.label && (
        <foreignObject
          x={midX - 30}
          y={midY - 8}
          width="60"
          height="16"
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              fontSize: '10px',
              textAlign: 'center',
              color: data?.color || '#6B7280',
              fontWeight: '500',
              textShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
              lineHeight: '16px',
              padding: '0',
              margin: '0',
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
            }}
          >
            {data.label}
          </div>
        </foreignObject>
      )}
    </>
  );
};

const TreeDiagramViewer = ({ treeData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // グリッドサイズの定数
  const GRID_SIZE = 20;

  // ノードタイプの定義
  const nodeTypes = useMemo(() => ({
    readonly: ReadOnlyCustomNode,
  }), []);

  // エッジタイプの定義
  const edgeTypes = useMemo(() => ({
    readonly: ReadOnlyCustomEdge,
  }), []);

  // React Flowのノード変更ハンドラー（選択状態のみ処理）
  const handleNodesChange = useCallback((changes) => {
    // 選択変更のみを許可
    const filteredChanges = changes.filter(change => 
      change.type === 'select'
    );
    
    if (filteredChanges.length > 0) {
      onNodesChange(filteredChanges);
    }
  }, [onNodesChange]);

  // 樹形図のレイアウト計算（読み取り専用版）
  const calculateTreeLayout = useCallback((treeData) => {
    if (!treeData || !treeData.id) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    
    // レベルごとの設定
    const LEVEL_CONFIG = {
      verticalSpacing: 200,
      baseRadius: 160,
      radiusGrowthRate: 1.0,
    };

    // グリッド対応での位置計算関数
    const calculatePositions = (node, level = 0, parentX = 0, parentY = 0, childIndex = 0, siblingCount = 1, parentVisualLevel = 1) => {
      if (!node || !node.id) return;

      let x, y;
      
      if (level === 0) {
        // ルートノード - グリッドの中心
        x = 0;
        y = 0;
      } else {
        // 現在のノードの視覚的レベル
        const nodeVisualLevel = node.visualLevel || 1;
        
        // 実際の表示レベル = 構造レベル + 視覚的レベル調整
        const actualLevel = level + (nodeVisualLevel - 1);
        
        // Y座標計算
        y = actualLevel * LEVEL_CONFIG.verticalSpacing;
        
        // グリッド位置の適用
        const gridOffsetX = (node.gridX || 0) * GRID_SIZE;
        
        // 基本の水平位置（兄弟ノード間の配置）
        let baseX = parentX;
        if (siblingCount > 1) {
          // 複数の兄弟がいる場合の初期配置
          const spacing = GRID_SIZE * 3;
          
          if (siblingCount === 2) {
            // 2つの子ノードの場合は左右対称に配置
            const offset = GRID_SIZE * 2;
            baseX = parentX + (childIndex === 0 ? -offset : offset);
          } else {
            // 3つ以上の子ノードの場合は等間隔配置
            const totalWidth = (siblingCount - 1) * spacing;
            const startX = parentX - totalWidth / 2;
            baseX = startX + childIndex * spacing;
          }
        }
        
        // グリッドオフセットを適用
        x = baseX + gridOffsetX;
        
        // グリッドに合わせる
        x = Math.round(x / GRID_SIZE) * GRID_SIZE;
        y = Math.round(y / GRID_SIZE) * GRID_SIZE;
      }

      // ノードサイズの調整
      const nodeSize = Math.max(30, (node.size || 50) - level * 2);
      const halfSize = nodeSize / 2;

      // ノードを作成（読み取り専用）
      const reactFlowNode = {
        id: node.id,
        type: 'readonly',
        position: { 
          x: x - halfSize, 
          y: y - halfSize 
        },
        data: {
          label: node.label || 'Untitled',
          color: node.color || '#3B82F6',
          size: nodeSize,
          isRoot: level === 0,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        zIndex: 1000,
        draggable: false,
        selectable: true,
        deletable: false,
        style: {
          pointerEvents: 'auto',
          cursor: 'default',
        }
      };

      nodes.push(reactFlowNode);

      // 子ノードの処理
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        node.children.forEach((child, index) => {
          if (child && child.id) {
            // エッジを作成（読み取り専用）
            edges.push({
              id: `${node.id}-${child.id}`,
              source: node.id,
              target: child.id,
              type: 'readonly',
              data: {
                label: child.edge?.label || '',
                color: child.edge?.color || '#6B7280',
              },
              style: {
                stroke: child.edge?.color || '#6B7280',
                strokeWidth: 2,
              },
              zIndex: 1,
            });

            // 子ノードを実際に一層深いレベルで計算
            const childStructuralLevel = level + 1;
            const nodeVisualLevel = node.visualLevel || 1;

            // 子ノードの位置を再帰的に計算
            calculatePositions(
              child, 
              childStructuralLevel, // 構造的レベルを1つ下げる
              x, 
              y, 
              index,
              node.children.length,
              nodeVisualLevel // 親の視覚的レベルを渡す
            );
          }
        });
      }
    };

    try {
      calculatePositions(treeData);
    } catch (error) {
      console.error('Error in calculatePositions:', error);
    }

    return { nodes, edges };
  }, []);

  // treeDataが変更されたときにノードとエッジを更新
  React.useEffect(() => {
    if (treeData && treeData.id) {
      try {
        const { nodes: newNodes, edges: newEdges } = calculateTreeLayout(treeData);
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (error) {
        console.error('Error calculating tree layout:', error);
      }
    } else {
      // データがない場合は空にする
      setNodes([]);
      setEdges([]);
    }
  }, [treeData, calculateTreeLayout]);

  // データがない場合の表示
  if (!treeData || !treeData.id) {
    return (
      <div className="tree-diagram-viewer">
        <div className="tree-diagram-viewer-empty">
          <div className="empty-tree-message">
            <GitBranch size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>樹形図が設定されていません</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-diagram-viewer">
      <div className="tree-diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={() => {}}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          multiSelectionKeyCode={null}
          panOnDrag={true}
          zoomOnScroll={true}
          panOnScroll={false}
          panOnScrollSpeed={0}
          selectNodesOnDrag={false}
          nodeOrigin={[0.5, 0.5]}
          snapToGrid={true}
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          connectionMode="loose"
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.2}
          maxZoom={2}
          defaultZoom={0.8}
        >
          <Controls position="top-right" />
          <MiniMap 
            nodeColor="#3B82F6"
            position="bottom-right"
            style={{
              height: 80,
              width: 120,
            }}
          />
          <Background 
            variant="dots" 
            gap={GRID_SIZE}
            size={1}
            color="#94a3b8"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TreeDiagramViewer;