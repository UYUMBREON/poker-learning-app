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
import { Plus, Trash2, Palette, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

// カスタムノードコンポーネント（枠のみ）
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

  const isSelected = selected || data.isSelected;

  return (
    <div
      className="custom-node"
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
        cursor: 'pointer',
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

      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelSubmit}
          onKeyDown={handleKeyPress}
          onClick={(e) => e.stopPropagation()}
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
            pointerEvents: 'none',
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
            pointerEvents: 'auto',
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

          {/* 階層上げボタン（視覚的レベルが1より大きい場合のみ表示） */}
          {(data.visualLevel || 1) > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onPromoteNode(id);
              }}
              className="node-control-btn promote-btn"
              title="階層を上げる"
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
                background: '#f59e0b',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                marginBottom: '1px',
              }}
            >
              <ChevronUp size={12} />
            </button>
          )}

          {/* 階層下げボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDemoteNode(id);
            }}
            className="node-control-btn demote-btn"
            title="階層を下げる"
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
              background: '#8b5cf6',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              marginBottom: '1px',
            }}
          >
            <ChevronDown size={12} />
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

// カスタムエッジコンポーネント
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');

  // エッジの中点を計算
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
  };

  const handleLabelSubmit = () => {
    data?.onEdgeLabelChange(id, label);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setLabel(data?.label || '');
      setIsEditing(false);
    }
  };

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
          strokeWidth: selected ? 3 : 2,
        }}
        markerEnd="url(#react-flow__arrowclosed)"
      />
      
      {/* エッジラベル */}
      {(data?.label || isEditing) && (
        <foreignObject
          x={midX - 30}
          y={midY - 8}
          width="60"
          height="16"
          style={{ overflow: 'visible' }}
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
                width: '60px',
                height: '16px',
                border: '1px solid #ccc',
                borderRadius: '2px',
                fontSize: '10px',
                textAlign: 'center',
                background: 'white',
                color: '#374151',
                padding: '0 2px',
              }}
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              style={{
                fontSize: '10px',
                textAlign: 'center',
                cursor: 'pointer',
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
              {data?.label}
            </div>
          )}
        </foreignObject>
      )}
    </>
  );
};

// エッジ設定パネル
const EdgeSettingsPanel = ({ edgeData, onUpdate, onClose }) => {
  const [label, setLabel] = useState(edgeData.label || '');
  const [color, setColor] = useState(edgeData.color || '#6B7280');

  const colors = [
    '#6B7280', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6',
    '#A855F7', '#000000', '#DC2626'
  ];

  const handleUpdate = () => {
    onUpdate(edgeData.id, { label: label.trim(), color });
    onClose();
  };

  return (
    <div className="edge-settings-panel">
      <div className="settings-header">
        <h4>エッジ設定</h4>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="setting-group">
        <label>ラベル</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="edge-label-input"
          placeholder="エッジの名前を入力..."
          maxLength={20}
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

// ノード設定パネル
const NodeSettingsPanel = ({ nodeData, onUpdate, onClose }) => {
  const pixelSize = nodeData.size || 50;
  const scaleSize = Math.round(1 + (pixelSize - 30) * (100 - 1) / (120 - 30));
  
  const [size, setSize] = useState(scaleSize);
  const [color, setColor] = useState(nodeData.color || '#3B82F6');

  const colors = [
    '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7', '#000000', '#6B7280', '#DC2626'
  ];

  const handleUpdate = () => {
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
        <label>枠の色</label>
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
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [showNodeSettings, setShowNodeSettings] = useState(false);
  const [showEdgeSettings, setShowEdgeSettings] = useState(false);
  const [settingsNodeData, setSettingsNodeData] = useState(null);
  const [settingsEdgeData, setSettingsEdgeData] = useState(null);

  const GRID_SIZE = 20;

  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  // React Flowのノード変更ハンドラー
  const handleNodesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'select') {
        if (change.selected) {
          setSelectedNodeId(change.id);
          setSelectedEdgeId(null);
        } else if (selectedNodeId === change.id) {
          setSelectedNodeId(null);
        }
      }
    });
    
    const filteredChanges = changes.filter(change => 
      change.type === 'select' || change.type === 'remove'
    );
    
    if (filteredChanges.length > 0) {
      onNodesChange(filteredChanges);
    }
  }, [onNodesChange, selectedNodeId]);

  // エッジ変更ハンドラー
  const handleEdgesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'select') {
        if (change.selected) {
          setSelectedEdgeId(change.id);
          setSelectedNodeId(null);
        } else if (selectedEdgeId === change.id) {
          setSelectedEdgeId(null);
        }
      }
    });
    
    const filteredChanges = changes.filter(change => 
      change.type === 'select' || change.type === 'remove'
    );
    
    if (filteredChanges.length > 0) {
      onEdgesChange(filteredChanges);
    }
  }, [onEdgesChange, selectedEdgeId]);

  // 空白クリックで選択解除
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // エッジダブルクリックハンドラー
  const handleEdgeDoubleClick = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    
    const edgeInTreeData = findEdgeInTreeData(treeData, edge.id);
    if (edgeInTreeData) {
      setSettingsEdgeData({
        id: edge.id,
        label: edgeInTreeData.label || '',
        color: edgeInTreeData.color || '#6B7280'
      });
      setShowEdgeSettings(true);
    }
  }, [treeData]);

  // ツリーデータ内のエッジを検索
  const findEdgeInTreeData = (node, edgeId) => {
    if (!node || !node.children) return null;
    
    for (const child of node.children) {
      const expectedEdgeId = `${node.id}-${child.id}`;
      if (expectedEdgeId === edgeId) {
        return child.edge || {};
      }
      
      const found = findEdgeInTreeData(child, edgeId);
      if (found) return found;
    }
    return null;
  };

  // ノード階層下げハンドラー（視覚的距離を2倍にする）
  const handleDemoteNode = useCallback((nodeId) => {
    if (!treeData) return;

    const demoteNodeInTree = (node) => {
      if (!node || !node.id) return node;
      
      if (node.id === nodeId) {
        // 現在のノードの視覚的階層レベルを下げる
        const currentLevel = node.visualLevel || 1;
        return { 
          ...node, 
          visualLevel: currentLevel + 1 // 視覚的レベルを1つ下げる
        };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(demoteNodeInTree)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = demoteNodeInTree(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error demoting node:', error);
    }
  }, [treeData, onTreeDataChange]);

  // ノード階層上げハンドラー（視覚的距離を元に戻す）
  const handlePromoteNode = useCallback((nodeId) => {
    if (!treeData) return;

    const promoteNodeInTree = (node) => {
      if (!node || !node.id) return node;
      
      if (node.id === nodeId) {
        // 現在のノードの視覚的階層レベルを上げる（元に戻す）
        const currentLevel = node.visualLevel || 1;
        if (currentLevel > 1) {
          return { 
            ...node, 
            visualLevel: currentLevel - 1 // 視覚的レベルを1つ上げる
          };
        }
        return node; // レベル1以下にはならない
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(promoteNodeInTree)
        };
      }
      return node;
    };

    try {
      const updatedTreeData = promoteNodeInTree(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error promoting node:', error);
    }
  }, [treeData, onTreeDataChange]);
  const handleEdgeLabelChange = useCallback((edgeId, newLabel) => {
    if (!treeData) return;

    const updateEdgeInTree = (node) => {
      if (!node || !node.children) return node;

      const updatedChildren = node.children.map(child => {
        const expectedEdgeId = `${node.id}-${child.id}`;
        if (expectedEdgeId === edgeId) {
          return {
            ...child,
            edge: {
              ...child.edge,
              label: newLabel
            }
          };
        }
        return updateEdgeInTree(child);
      });

      return { ...node, children: updatedChildren };
    };

    try {
      const updatedTreeData = updateEdgeInTree(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error updating edge label:', error);
    }
  }, [treeData, onTreeDataChange]);

  // 既存のハンドラー関数（省略部分は元のコードと同じ）
  const handleMoveNode = useCallback((nodeId, direction) => {
    if (!treeData) return;

    const moveAmount = direction === 'left' ? -1 : 1;
    
    const updateNodePosition = (node) => {
      if (!node || !node.id) return node;
      
      if (node.id === nodeId) {
        const currentX = node.gridX || 0;
        const newGridX = currentX + moveAmount;
        return { ...node, gridX: newGridX };
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

  const handleLabelChange = useCallback((nodeId, newLabel) => {
    if (!treeData) return;

    const updateNodeLabel = (node) => {
      if (!node || !node.id) return node;
      
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

  const handleAddChild = useCallback((parentId) => {
    if (!treeData) return;

    const addChildToNode = (node) => {
      if (!node || !node.id) return node;
      
      if (node.id === parentId) {
        const childCount = node.children ? node.children.length : 0;
        if (childCount >= 3) {
          alert('子ノードは最大3つまでです');
          return node;
        }
        
        // 親ノードの視覚的レベルに基づいて子ノードの初期視覚的レベルを設定
        const parentVisualLevel = node.visualLevel || 1;
        const childVisualLevel = parentVisualLevel > 1 ? 2 : 1; // 階層下げされた親の子は視覚的レベル2から開始
        
        const newChild = {
          id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          label: `Node ${childCount + 1}`,
          color: '#10B981',
          size: 50,
          gridX: 0,
          visualLevel: childVisualLevel, // 親の状態に応じた視覚的レベル
          children: [],
          edge: {
            label: '',
            color: '#6B7280'
          }
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

  const handleDeleteNode = useCallback((nodeId) => {
    if (!treeData) return;

    if (window.confirm('このノードと子ノードを削除しますか？')) {
      const removeNode = (node) => {
        if (!node) return node;
        
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

  const handleShowSettings = useCallback((nodeId) => {
    if (!treeData) return;

    const findNode = (node) => {
      if (!node || !node.id) return null;
      
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
        setShowNodeSettings(true);
      }
    } catch (error) {
      console.error('Error finding node for settings:', error);
    }
  }, [treeData]);

  // ノード設定更新ハンドラー
  const handleNodeUpdate = useCallback((nodeId, updates) => {
    if (!treeData) return;

    const updateNode = (node) => {
      if (!node || !node.id) return node;
      
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

  // エッジ設定更新ハンドラー
  const handleEdgeUpdate = useCallback((edgeId, updates) => {
    if (!treeData) return;

    const updateEdgeInTree = (node) => {
      if (!node || !node.children) return node;

      const updatedChildren = node.children.map(child => {
        const expectedEdgeId = `${node.id}-${child.id}`;
        if (expectedEdgeId === edgeId) {
          return {
            ...child,
            edge: {
              ...child.edge,
              ...updates
            }
          };
        }
        return updateEdgeInTree(child);
      });

      return { ...node, children: updatedChildren };
    };

    try {
      const updatedTreeData = updateEdgeInTree(treeData);
      if (updatedTreeData) {
        onTreeDataChange(updatedTreeData);
      }
    } catch (error) {
      console.error('Error updating edge:', error);
    }
  }, [treeData, onTreeDataChange]);

  // 樹形図のレイアウト計算（更新版）
  const calculateTreeLayout = useCallback((treeData) => {
    if (!treeData || !treeData.id) {
      return { nodes: [], edges: [] };
    }

    const nodes = [];
    const edges = [];
    
    const LEVEL_CONFIG = {
      verticalSpacing: 200,
      baseRadius: 160,
      radiusGrowthRate: 1.0,
    };

    const calculatePositions = (node, level = 0, parentX = 0, parentY = 0, childIndex = 0, siblingCount = 1) => {
      if (!node || !node.id) return;

      let x, y;
      
      if (level === 0) {
        x = 0;
        y = 0;
      } else {
        // 視覚的レベルを考慮した Y 座標計算
        const visualLevel = node.visualLevel || 1;
        const baseY = level * LEVEL_CONFIG.verticalSpacing;
        const additionalSpacing = (visualLevel - 1) * LEVEL_CONFIG.verticalSpacing;
        y = baseY + additionalSpacing;
        
        const gridOffsetX = (node.gridX || 0) * GRID_SIZE;
        
        let baseX = parentX;
        if (siblingCount > 1) {
          const spacing = GRID_SIZE * 3;
          
          if (siblingCount === 2) {
            const offset = GRID_SIZE * 2;
            baseX = parentX + (childIndex === 0 ? -offset : offset);
          } else {
            const totalWidth = (siblingCount - 1) * spacing;
            const startX = parentX - totalWidth / 2;
            baseX = startX + childIndex * spacing;
          }
        }
        
        x = baseX + gridOffsetX;
        x = Math.round(x / GRID_SIZE) * GRID_SIZE;
        y = Math.round(y / GRID_SIZE) * GRID_SIZE;
      }

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
          visualLevel: node.visualLevel || 1, // 視覚的レベル情報を追加
          onLabelChange: handleLabelChange,
          onAddChild: handleAddChild,
          onDelete: handleDeleteNode,
          onShowSettings: handleShowSettings,
          onMoveNode: handleMoveNode,
          onPromoteNode: handlePromoteNode,
          onDemoteNode: handleDemoteNode,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        zIndex: 1000,
        draggable: false,
        selectable: true,
        deletable: false,
        selected: selectedNodeId === node.id,
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
            // エッジを作成（カスタムエッジ）
            const edgeId = `${node.id}-${child.id}`;
            edges.push({
              id: edgeId,
              source: node.id,
              target: child.id,
              type: 'custom',
              data: {
                label: child.edge?.label || '',
                color: child.edge?.color || '#6B7280',
                onEdgeLabelChange: handleEdgeLabelChange,
              },
              style: {
                stroke: child.edge?.color || '#6B7280',
                strokeWidth: selectedEdgeId === edgeId ? 3 : 2,
              },
              selected: selectedEdgeId === edgeId,
              selectable: true,
              zIndex: 1,
            });

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
  }, [selectedNodeId, selectedEdgeId, handleLabelChange, handleAddChild, handleDeleteNode, handleShowSettings, handleMoveNode, handlePromoteNode, handleDemoteNode, handleEdgeLabelChange]);

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
      const initialTreeData = {
        id: 'root',
        label: 'Root',
        color: '#3B82F6',
        size: 60,
        gridX: 0,
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
          onEdgesChange={handleEdgesChange}
          onPaneClick={handlePaneClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
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

      {/* ノード設定パネル */}
      {showNodeSettings && settingsNodeData && (
        <div className="settings-overlay">
          <NodeSettingsPanel
            nodeData={settingsNodeData}
            onUpdate={handleNodeUpdate}
            onClose={() => setShowNodeSettings(false)}
          />
        </div>
      )}

      {/* エッジ設定パネル */}
      {showEdgeSettings && settingsEdgeData && (
        <div className="settings-overlay">
          <EdgeSettingsPanel
            edgeData={settingsEdgeData}
            onUpdate={handleEdgeUpdate}
            onClose={() => setShowEdgeSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default TreeDiagramEditor;