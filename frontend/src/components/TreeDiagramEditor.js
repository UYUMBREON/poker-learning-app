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
import { Plus, Trash2, Palette, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // React Flowの選択状態またはカスタム選択状態を使用
  const isSelected = selected || data.isSelected;

  return (
    <div
      className="custom-node"
      style={{
        backgroundColor: data.color,
        width: `${data.size}px`,
        height: `${data.size}px`,
        border: isSelected ? '3px solid #3b82f6' : '2px solid #e2e8f0',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: data.color === '#FFFFFF' ? '#000000' : '#FFFFFF',
        fontWeight: 'bold',
        fontSize: `${Math.max(10, data.size / 6)}px`,
        cursor: 'pointer',
        position: 'relative',
        boxShadow: isSelected 
          ? '0 4px 16px rgba(59, 130, 246, 0.4)' 
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        userSelect: 'none',
        pointerEvents: 'auto',
        transition: 'all 0.2s ease',
        // React Flowの選択機能を確実に動作させるための設定
        outline: 'none',
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

      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelSubmit}
          onKeyDown={handleKeyPress}
          onClick={(e) => e.stopPropagation()} // 編集中のクリックを停止
          autoFocus
          style={{
            width: '80%',
            height: '80%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'inherit',
            textAlign: 'center',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            borderRadius: '50%',
          }}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 4px',
            maxWidth: '90%',
            textAlign: 'center',
            pointerEvents: 'none', // テキストへのクリックを無効化してノード全体での選択を促進
          }}
        >
          {data.label}
        </span>
      )}
      
      {isSelected && (
        <div 
          className="node-controls"
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 1001,
            pointerEvents: 'auto', // 操作ボタンのクリックを有効化
          }}
        >
          {/* 左移動ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onMoveNode(id, 'left');
            }}
            className="node-control-btn move-left-btn"
            title="左に移動"
            style={{
              width: '22px',
              height: '22px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              background: '#3b82f6',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              marginBottom: '1px',
            }}
          >
            <ChevronLeft size={12} />
          </button>
          
          {/* 右移動ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onMoveNode(id, 'right');
            }}
            className="node-control-btn move-right-btn"
            title="右に移動"
            style={{
              width: '22px',
              height: '22px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              background: '#3b82f6',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              marginBottom: '1px',
            }}
          >
            <ChevronRight size={12} />
          </button>
          
          {/* 子ノード追加ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild(id);
            }}
            className="node-control-btn add-btn"
            title="子ノードを追加"
            style={{
              width: '22px',
              height: '22px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              background: '#10b981',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              marginBottom: '1px',
            }}
          >
            <Plus size={12} />
          </button>
          
          {/* 削除ボタン（ルートノード以外） */}
          {!data.isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete(id);
              }}
              className="node-control-btn delete-btn"
              title="ノードを削除"
              style={{
                width: '22px',
                height: '22px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
                background: '#ef4444',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                marginBottom: '1px',
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
          
          {/* 設定ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onShowSettings(id);
            }}
            className="node-control-btn settings-btn"
            title="設定"
            style={{
              width: '22px',
              height: '22px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              background: '#6b7280',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsNodeData, setSettingsNodeData] = useState(null);

  // グリッドサイズの定数
  const GRID_SIZE = 20; // 20pxグリッド（表示しやすいサイズに調整）

  // ノードタイプの定義
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  // React Flowのノード変更ハンドラー（選択状態を処理）
  const handleNodesChange = useCallback((changes) => {
    // 選択変更を処理
    changes.forEach((change) => {
      if (change.type === 'select') {
        if (change.selected) {
          setSelectedNodeId(change.id);
        } else if (selectedNodeId === change.id) {
          setSelectedNodeId(null);
        }
      }
    });
    
    // 他の変更は無視（位置変更など）
    const filteredChanges = changes.filter(change => 
      change.type === 'select' || change.type === 'remove'
    );
    
    if (filteredChanges.length > 0) {
      onNodesChange(filteredChanges);
    }
  }, [onNodesChange, selectedNodeId]);

  // 空白クリックで選択解除
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ノード移動ハンドラー（グリッド単位）
  const handleMoveNode = useCallback((nodeId, direction) => {
    if (!treeData) {
      console.error('Tree data is not available');
      return;
    }

    // グリッド単位での移動量を計算
    const moveAmount = direction === 'left' ? -1 : 1;
    
    // ノード位置データを更新（treeDataには位置情報を保存）
    const updateNodePosition = (node) => {
      if (!node || !node.id) {
        return node;
      }
      
      if (node.id === nodeId) {
        // 現在の位置に移動量を加算
        const currentX = node.gridX || 0; // グリッド座標で管理
        const newGridX = currentX + moveAmount;
        
        return { 
          ...node, 
          gridX: newGridX // グリッド座標を保存
        };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNodePosition)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = updateNodePosition(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error moving node:', error);
    }
  }, [treeData, onTreeDataChange]);

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
          gridX: 0, // 初期グリッド位置
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
        setSettingsNodeData({
          id: node.id,
          size: node.size,
          color: node.color
        });
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

  // 修正版：樹形図のレイアウト計算（グリッド位置対応）
  const calculateTreeLayout = useCallback((treeData) => {
    if (!treeData || !treeData.id) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    
    // レベルごとの設定
    const LEVEL_CONFIG = {
      verticalSpacing: 200, // 100px → 200px（2倍に変更）
      baseRadius: 160,
      radiusGrowthRate: 1.0,
    };

    // グリッド対応での位置計算関数
    const calculatePositions = (node, level = 0, parentX = 0, parentY = 0, childIndex = 0, siblingCount = 1) => {
      if (!node || !node.id) return;

      let x, y;
      
      if (level === 0) {
        // ルートノード - グリッドの中心
        x = 0;
        y = 0;
      } else {
        // 子ノードの位置計算
        y = level * LEVEL_CONFIG.verticalSpacing;
        
        // グリッド位置の適用
        const gridOffsetX = (node.gridX || 0) * GRID_SIZE;
        
        // 基本の水平位置（兄弟ノード間の配置）
        let baseX = parentX;
        if (siblingCount > 1) {
          // 複数の兄弟がいる場合の初期配置
          const spacing = GRID_SIZE * 3; // 3グリッド間隔
          
          if (siblingCount === 2) {
            // 2つの子ノードの場合は左右対称に配置
            const offset = GRID_SIZE * 2; // 2グリッド分のオフセット
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
          isSelected: selectedNodeId === node.id,
          onLabelChange: handleLabelChange,
          onAddChild: handleAddChild,
          onDelete: handleDeleteNode,
          onShowSettings: handleShowSettings,
          onMoveNode: handleMoveNode,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        zIndex: 1000,
        draggable: false,
        selectable: true, // 選択可能を明示
        deletable: false,
        selected: selectedNodeId === node.id, // React Flow用の選択状態
        style: {
          pointerEvents: 'auto',
          cursor: 'pointer',
        }
      };

      nodes.push(reactFlowNode);

      // 子ノードの処理
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
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
                strokeWidth: 2,
              },
              zIndex: 1,
            });

            // 子ノードの位置を再帰的に計算
            calculatePositions(
              child, 
              level + 1, 
              x, 
              y, 
              index,
              node.children.length
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
  }, [handleLabelChange, handleAddChild, handleDeleteNode, handleShowSettings, handleMoveNode]);

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
        gridX: 0, // 初期グリッド位置
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
          onNodesChange={handleNodesChange}
          onEdgesChange={() => {}}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
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

      {showSettings && settingsNodeData && (
        <div className="settings-overlay">
          <NodeSettingsPanel
            nodeData={settingsNodeData}
            onUpdate={handleNodeUpdate}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TreeDiagramEditor;