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
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
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
            onClick={() => data.onAddChild(id)}
            className="node-control-btn add-btn"
            title="子ノードを追加"
          >
            <Plus size={12} />
          </button>
          {!data.isRoot && (
            <button
              onClick={() => data.onDelete(id)}
              className="node-control-btn delete-btn"
              title="ノードを削除"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={() => data.onShowSettings(id)}
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
const NodeSettingsPanel = ({ node, onUpdate, onClose }) => {
  const [size, setSize] = useState(node.data.size);
  const [color, setColor] = useState(node.data.color);

  const colors = [
    '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7', '#FFFFFF', '#000000', '#6B7280'
  ];

  const handleUpdate = () => {
    onUpdate(node.id, { size: parseInt(size), color });
    onClose();
  };

  return (
    <div className="node-settings-panel">
      <div className="settings-header">
        <h4>ノード設定</h4>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="setting-group">
        <label>サイズ: {size}px</label>
        <input
          type="range"
          min="30"
          max="120"
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

  // 樹形図のレイアウト計算
  const calculateTreeLayout = useCallback((treeData) => {
    if (!treeData || !treeData.id) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    const levelHeight = 150; // レベル間の垂直距離
    const baseSpacing = 100; // 基本的な水平間隔

    // ノードの位置を計算するための再帰関数
    const calculatePositions = (node, level = 0, parentX = 0, parentY = 0, siblingIndex = 0, totalSiblings = 1) => {
      if (!node || !node.id) {
        return;
      }

      // 子ノードの数を取得
      const childCount = node.children ? node.children.length : 0;
      
      // 現在のレベルでの位置計算
      let x, y;
      
      if (level === 0) {
        // ルートノード
        x = 0;
        y = 0;
      } else {
        // 子ノードの配置
        if (totalSiblings === 1) {
          x = parentX;
        } else {
          // 複数の兄弟ノードがある場合の水平配置
          const spacing = Math.max(baseSpacing, 120 + (level * 20));
          const totalWidth = (totalSiblings - 1) * spacing;
          x = parentX - totalWidth / 2 + siblingIndex * spacing;
        }
        y = parentY + levelHeight;
      }

      // ノードを作成
      const reactFlowNode = {
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: node.label || 'Untitled',
          color: node.color || '#3B82F6',
          size: node.size || 50,
          isRoot: level === 0,
          onLabelChange: (nodeId, newLabel) => handleLabelChange(nodeId, newLabel),
          onAddChild: (parentId) => handleAddChild(parentId),
          onDelete: (nodeId) => handleDeleteNode(nodeId),
          onShowSettings: (nodeId) => handleShowSettings(nodeId),
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      nodes.push(reactFlowNode);

      // 子ノードを処理
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child, index) => {
          if (child && child.id) {
            // エッジを作成
            edges.push({
              id: `${node.id}-${child.id}`,
              source: node.id,
              target: child.id,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: {
                stroke: '#6B7280',
                strokeWidth: 2,
              },
            });

            // 子ノードの位置を再帰的に計算
            calculatePositions(child, level + 1, x, y, index, node.children.length);
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
  }, []); // 依存配列を空にして循環依存を回避

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
  }, [treeData, onTreeDataChange]); // calculateTreeLayoutを依存関係から削除

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

  return (
    <div className="tree-diagram-editor">
      <div className="tree-diagram-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.2,
          }}
          minZoom={0.1}
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
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>

      {showSettings && selectedNode && (
        <div className="settings-overlay">
          <NodeSettingsPanel
            node={{ id: selectedNode.id, data: selectedNode }}
            onUpdate={handleNodeUpdate}
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TreeDiagramEditor;