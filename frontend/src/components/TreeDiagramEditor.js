import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  MarkerType,
  Handle,
} from 'react-flow-renderer';
import { Plus, Trash2, Palette, Settings } from 'lucide-react';

// カスタムノードコンポーネント
const CustomNode = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
  };

  const handleLabelSubmit = () => {
    data.onLabelChange(id, label);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="custom-node"
      style={{
        backgroundColor: data.color,
        width: `${data.size}px`,
        height: `${data.size}px`,
        border: selected ? '3px solid #3b82f6' : '2px solid #e2e8f0',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: data.color === '#FFFFFF' ? '#000000' : '#FFFFFF',
        fontWeight: 'bold',
        fontSize: `${Math.max(10, data.size / 6)}px`,
        cursor: 'grab',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        // 横方向のドラッグのみ許可
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      // 縦方向のドラッグを防止
      onDragStart={(e) => {
        // ドラッグ開始時にY座標を記録
        e.dataTransfer.setData('text/plain', '');
        data.onDragStart && data.onDragStart(id, e);
      }}
    >
      {/* React Flow用のHandleを追加 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'transparent',
          border: 'none',
          width: '1px',
          height: '1px',
          top: '50%',
          transform: 'translateY(-50%)',
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
          bottom: '50%',
          transform: 'translateY(50%)',
        }}
      />

      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelSubmit}
          onKeyDown={handleKeyPress}
          autoFocus
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'inherit',
            textAlign: 'center',
            fontSize: 'inherit',
            fontWeight: 'inherit',
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 4px',
          }}
        >
          {data.label}
        </span>
      )}
      
      {selected && (
        <div className="node-controls">
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild(id);
            }}
            className="node-control-btn add-btn"
            title="子ノードを追加"
          >
            <Plus size={12} />
          </button>
          {!data.isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete(id);
              }}
              className="node-control-btn delete-btn"
              title="ノードを削除"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onShowSettings(id);
            }}
            className="node-control-btn settings-btn"
            title="設定"
          >
            <Settings size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

// ノード設定パネル
const NodeSettingsPanel = ({ nodeData, onUpdate, onClose }) => {
  // 実際のピクセルサイズ（30-120px）を1-100のスケールに変換
  const pixelSize = nodeData.size || 50;
  const scaleSize = Math.round(1 + (pixelSize - 30) * (100 - 1) / (120 - 30));
  
  const [size, setSize] = useState(scaleSize);
  const [color, setColor] = useState(nodeData.color || '#3B82F6');

  const colors = [
    '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7', '#FFFFFF', '#000000', '#6B7280'
  ];

  const handleUpdate = () => {
    // 1-100のスケールを30-120pxに変換
    const actualSize = Math.round(30 + (parseInt(size) - 1) * (120 - 30) / (100 - 1));
    onUpdate(nodeData.id, { size: actualSize, color });
    onClose();
  };

  return (
    <div className="node-settings-panel">
      <div className="settings-header">
        <h4>ノード設定</h4>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="setting-group">
        <label>サイズ: {size}</label>
        <input
          type="range"
          min="1"
          max="100"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="size-slider"
        />
      </div>

      <div className="setting-group">
        <label>色</label>
        <div className="color-grid">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`color-option ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={handleUpdate} className="update-btn">
          更新
        </button>
        <button onClick={onClose} className="cancel-btn">
          キャンセル
        </button>
      </div>
    </div>
  );
};

const TreeDiagramEditor = ({ treeData, onTreeDataChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // ノードタイプの定義
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  // 横方向のドラッグのみを許可するノード変更ハンドラー
  const handleNodesChange = useCallback((changes) => {
    setNodes((currentNodes) => {
      return currentNodes.map((node) => {
        const change = changes.find(c => c.id === node.id && c.type === 'position');
        if (change && change.position) {
          // Y座標は固定、X座標のみ変更を許可
          const newX = change.position.x;
          const fixedY = node.position.y; // Y座標は変更しない
          
          // グリッドにスナップ（20pxグリッド）
          const gridSize = 20;
          const snappedX = Math.round(newX / gridSize) * gridSize;
          
          return {
            ...node,
            position: {
              x: snappedX,
              y: fixedY
            }
          };
        }
        return node;
      });
    });
  }, [setNodes]);

  // ラベル変更ハンドラー
  const handleLabelChange = useCallback((nodeId, newLabel) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    const updateNodeLabel = (node) => {
      if (!node || !node.id) {
        return node;
      }
      
      if (node.id === nodeId) {
        return { ...node, label: newLabel };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodeLabel)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = updateNodeLabel(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error updating node label:', error);
    }
  }, [treeData, onTreeDataChange]);

  // 子ノード追加ハンドラー
  const handleAddChild = useCallback((parentId) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    const addChildToNode = (node) => {
      if (!node || !node.id) {
        return node;
      }
      
      if (node.id === parentId) {
        const childCount = node.children ? node.children.length : 0;
        if (childCount >= 3) {
          alert('子ノードは最大3つまでです');
          return node;
        }
        
        const newChild = {
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          label: `Node ${childCount + 1}`,
          color: '#10B981',
          size: 50,
          children: []
        };

        return {
          ...node,
          children: [...(node.children || []), newChild]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(addChildToNode)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = addChildToNode(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error adding child node:', error);
    }
  }, [treeData, onTreeDataChange]);

  // ノード削除ハンドラー
  const handleDeleteNode = useCallback((nodeId) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    if (window.confirm('このノードと子ノードを削除しますか？')) {
      const removeNode = (node) => {
        if (!node) {
          return node;
        }
        
        if (node.children) {
          return {
            ...node,
            children: node.children
              .filter(child => child && child.id !== nodeId)
              .map(removeNode)
          };
        }
        return node;
      };

      try {
        const updatedTreeData = removeNode(treeData);
        if (updatedTreeData) {
          onTreeDataChange(updatedTreeData);
        }
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    }
  }, [treeData, onTreeDataChange]);

  // 設定表示ハンドラー
  const handleShowSettings = useCallback((nodeId) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    const findNode = (node) => {
      if (!node || !node.id) {
        return null;
      }
      
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };

    try {
      const node = findNode(treeData);
      if (node) {
        setSelectedNode(node);
        setShowSettings(true);
      }
    } catch (error) {
      console.error('Error finding node for settings:', error);
    }
  }, [treeData]);

  // ノード設定更新ハンドラー
  const handleNodeUpdate = useCallback((nodeId, updates) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    const updateNode = (node) => {
      if (!node || !node.id) {
        return node;
      }
      
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = updateNode(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error updating node:', error);
    }
  }, [treeData, onTreeDataChange]);

  // 【修正版】樹形図のレイアウト計算 - 下方向配置＋同一階層高さ統一
  const calculateTreeLayout = useCallback((treeData) => {
    if (!treeData || !treeData.id) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    
    // 【修正】レベルごとの設定
    const LEVEL_CONFIG = {
      verticalSpacing: 315,
      baseAngle: 180,
      angleReductionRate: 0.25, // 0.35→0.25に変更（より急速に狭まる）
      minAngle: 20,             // 30→20度に変更（より狭い最小角度）
      baseRadius: 378,          // 初期半径（270 × 1.4）
      radiusGrowthRate: 1.2,    // 半径増加率
      edgeReductionRate: 0.9,   // エッジ長短縮率
      minEdgeRatio: 1/3         // 最小エッジ長比率（初期の1/3）
    };

    // 【修正】下方向配置＋同一階層高さ統一での位置計算関数
    const calculatePositions = (node, level = 0, parentX = 0, parentY = 0, 
                               parentAngle = 90, maxAngle = LEVEL_CONFIG.baseAngle) => {
      if (!node || !node.id) return;

      let x, y;
      
      if (level === 0) {
        // ルートノード
        x = 0;
        y = 0;
      } else {
        // 【修正】同一階層での高さ統一 + 下方向配置 + エッジ長段階短縮
        // エッジ長の計算（レベルに応じて短縮）
        const edgeReduction = Math.pow(LEVEL_CONFIG.edgeReductionRate, level - 1);
        const minReduction = LEVEL_CONFIG.minEdgeRatio;
        const actualReduction = Math.max(minReduction, edgeReduction);
        
        const fixedY = level * LEVEL_CONFIG.verticalSpacing * actualReduction; // エッジ長に応じた固定Y座標
        
        // 水平方向の配置は放射角度で計算（エッジ長調整済み）
        const horizontalRadius = LEVEL_CONFIG.baseRadius * actualReduction * Math.pow(LEVEL_CONFIG.radiusGrowthRate, level - 1);
        
        // 角度から水平位置を計算（下方向なので角度の意味を調整）
        if (parentAngle === 90) {
          // 真下の場合
          x = parentX;
        } else {
          // 角度に基づく水平オフセット
          const angleOffset = parentAngle - 90; // 真下からの偏差
          const radians = (angleOffset * Math.PI) / 180;
          x = parentX + horizontalRadius * Math.sin(radians);
        }
        
        y = fixedY; // 同一階層では固定Y座標
      }

      // ノードサイズの調整
      const nodeSize = Math.max(30, (node.size || 50) - level * 3); // レベルに応じてサイズを縮小
      const halfSize = nodeSize / 2;

      // ノードを作成
      const reactFlowNode = {
        id: node.id,
        type: 'custom',
        position: { 
          x: x - halfSize, 
          y: y - halfSize 
        },
        data: {
          label: node.label || 'Untitled',
          color: node.color || '#3B82F6',
          size: nodeSize,
          isRoot: level === 0,
          onLabelChange: handleLabelChange,
          onAddChild: handleAddChild,
          onDelete: handleDeleteNode,
          onShowSettings: handleShowSettings,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        zIndex: 1000,
        // ドラッグを完全に無効化するための設定
        draggable: false,
        selectable: true,
        deletable: false,
        // 位置変更を防ぐための設定
        positionAbsolute: { x: x - halfSize, y: y - halfSize },
        // スタイルでポインターイベントを制御
        style: {
          pointerEvents: 'auto', // 選択は可能にする
        }
      };

      nodes.push(reactFlowNode);

      // 【修正】子ノードの角度計算（下方向配置用）
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        // 次のレベルでの最大角度を計算（放射角度を狭める）
        const nextMaxAngle = Math.max(
          LEVEL_CONFIG.minAngle, 
          maxAngle * LEVEL_CONFIG.angleReductionRate
        );

        const childCount = node.children.length;
        
        // 子ノードの角度配列を計算（下方向基準）
        let childAngles = [];
        
        if (childCount === 1) {
          // 子ノードが1つの場合は真下に配置
          childAngles = [90]; // 真下 = 90度
        } else {
          // 複数の子ノードの場合は縮小された角度範囲内で配置
          // デバッグ用ログ
          console.log(`Level ${level + 1}: maxAngle=${nextMaxAngle}, childCount=${childCount}`);
          
          const angleStep = nextMaxAngle / (childCount - 1);
          const startAngle = 90 - nextMaxAngle / 2; // 真下から左右に展開
          
          for (let i = 0; i < childCount; i++) {
            const angle = startAngle + angleStep * i;
            childAngles.push(angle);
            console.log(`  Child ${i}: angle=${angle}`);
          }
        }

        // 子ノードを処理
        node.children.forEach((child, index) => {
          if (child && child.id) {
            // エッジを作成
            edges.push({
              id: `${node.id}-${child.id}`,
              source: node.id,
              target: child.id,
              type: 'straight',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: {
                stroke: '#6B7280',
                strokeWidth: 2, // 統一された太さ
              },
              zIndex: 1,
            });

            // 子ノードの位置を再帰的に計算（縮小された角度を渡す）
            calculatePositions(
              child, 
              level + 1, 
              x, 
              y, 
              childAngles[index], 
              nextMaxAngle // 縮小された角度を次のレベルに渡す
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
  }, [handleLabelChange, handleAddChild, handleDeleteNode, handleShowSettings]);

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
    } else if (!treeData) {
      // 初期ルートノードを作成
      const initialTreeData = {
        id: 'root',
        label: 'Root',
        color: '#3B82F6',
        size: 60,
        children: []
      };
      onTreeDataChange(initialTreeData);
    }
  }, [treeData, onTreeDataChange, calculateTreeLayout]);

  return (
    <div className="tree-diagram-editor">
      <div className="tree-diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={() => {}} // ノード変更を完全に無効化
          onEdgesChange={() => {}} // エッジ変更も無効化
          nodeTypes={nodeTypes}
          nodesDraggable={false}        // ノードの移動を無効化
          nodesConnectable={false}      // ノードの接続を無効化
          elementsSelectable={true}     // 選択は有効（編集のため）
          panOnDrag={true}              // パン操作は有効
          zoomOnScroll={true}           // ズーム操作は有効
          panOnScroll={false}           // スクロールでのパンを無効化
          panOnScrollSpeed={0}          // パンスピードを0に
          selectNodesOnDrag={false}     // ドラッグでの選択を無効化
          // 追加の設定でドラッグを完全に無効化
          nodeOrigin={[0.5, 0.5]}       // ノードの原点を中央に固定
          snapToGrid={false}            // グリッドスナップを無効化
          snapGrid={[1, 1]}             // 最小グリッドサイズ
          connectionMode="loose"        // 接続モードを緩やかに
          // すべてのインタラクションを制御
          onNodeDrag={() => {}}         // ドラッグイベントを無効化
          onNodeDragStart={() => {}}    // ドラッグ開始を無効化
          onNodeDragStop={() => {}}     // ドラッグ終了を無効化
          onSelectionDrag={() => {}}    // 選択範囲ドラッグを無効化
          onSelectionDragStart={() => {}} // 選択範囲ドラッグ開始を無効化
          onSelectionDragStop={() => {}}  // 選択範囲ドラッグ終了を無効化
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultZoom={0.6}
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
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>

      {showSettings && selectedNode && (
        <div className="settings-overlay">
          <NodeSettingsPanel
            nodeData={{
              id: selectedNode.id,
              size: selectedNode.size,
              color: selectedNode.color
            }}
            onUpdate={handleNodeUpdate}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TreeDiagramEditor;