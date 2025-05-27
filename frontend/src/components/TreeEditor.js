import React, { useState, useCallback } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';

const TreeEditor = ({ treeData, onChange }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const nodes = treeData?.nodes || [];
  const edges = treeData?.edges || [];

  const addNode = useCallback(() => {
    const newNode = {
      id: `node_${Date.now()}`,
      label: '新しいノード',
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50
    };

    const newTreeData = {
      nodes: [...nodes, newNode],
      edges: [...edges]
    };

    onChange(newTreeData);
  }, [nodes, edges, onChange]);

  const deleteNode = useCallback((nodeId) => {
    const newTreeData = {
      nodes: nodes.filter(node => node.id !== nodeId),
      edges: edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    };
    onChange(newTreeData);
    setSelectedNode(null);
  }, [nodes, edges, onChange]);

  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    const newTreeData = {
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, label: newLabel } : node
      ),
      edges: [...edges]
    };
    onChange(newTreeData);
  }, [nodes, edges, onChange]);

  const updateNodePosition = useCallback((nodeId, x, y) => {
    const newTreeData = {
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, x, y } : node
      ),
      edges: [...edges]
    };
    onChange(newTreeData);
  }, [nodes, edges, onChange]);

  const connectNodes = useCallback((sourceId, targetId) => {
    // 既に接続されているかチェック
    const existingEdge = edges.find(edge => 
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
    
    if (existingEdge) return;

    const newEdge = {
      id: `edge_${sourceId}_${targetId}`,
      source: sourceId,
      target: targetId
    };

    const newTreeData = {
      nodes: [...nodes],
      edges: [...edges, newEdge]
    };
    onChange(newTreeData);
  }, [nodes, edges, onChange]);

  const startEditing = (node) => {
    setEditingNode(node.id);
    setEditValue(node.label);
  };

  const finishEditing = () => {
    if (editingNode && editValue.trim()) {
      updateNodeLabel(editingNode, editValue.trim());
    }
    setEditingNode(null);
    setEditValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingNode(null);
      setEditValue('');
    }
  };

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    
    if (selectedNode && selectedNode !== node.id) {
      // 2つのノードを接続
      connectNodes(selectedNode, node.id);
      setSelectedNode(null);
    } else {
      setSelectedNode(selectedNode === node.id ? null : node.id);
    }
  };

  const handleNodeDrag = (node, e) => {
    const rect = e.currentTarget.closest('.tree-canvas').getBoundingClientRect();
    const x = e.clientX - rect.left - 50; // ノードの半分のサイズを調整
    const y = e.clientY - rect.top - 25;
    updateNodePosition(node.id, Math.max(0, x), Math.max(0, y));
  };

  // SVGで線を描画するための計算
  const renderEdges = () => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;

      return (
        <line
          key={edge.id}
          x1={sourceNode.x + 50}
          y1={sourceNode.y + 25}
          x2={targetNode.x + 50}
          y2={targetNode.y + 25}
          stroke="#94a3b8"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      );
    });
  };

  return (
    <div className="tree-editor">
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={addNode}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem'
          }}
        >
          <Plus size={16} />
          ノード追加
        </button>
      </div>

      <div 
        className="tree-canvas"
        style={{
          position: 'relative',
          width: '100%',
          height: '350px',
          border: '2px dashed #cbd5e1',
          borderRadius: '8px',
          background: '#f8fafc',
          overflow: 'hidden'
        }}
        onClick={() => setSelectedNode(null)}
      >
        {/* SVGで線を描画 */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#94a3b8"
              />
            </marker>
          </defs>
          {renderEdges()}
        </svg>

        {/* ノード */}
        {nodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              width: '100px',
              height: '50px',
              background: selectedNode === node.id ? '#3b82f6' : 'white',
              color: selectedNode === node.id ? 'white' : '#334155',
              border: `2px solid ${selectedNode === node.id ? '#3b82f6' : '#e2e8f0'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '500',
              zIndex: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onClick={(e) => handleNodeClick(node, e)}
            onDoubleClick={() => startEditing(node)}
            draggable
            onDragEnd={(e) => handleNodeDrag(node, e)}
          >
            {editingNode === node.id ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyPress}
                style={{
                  width: '90px',
                  padding: '2px 4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 'inherit',
                  textAlign: 'center',
                  outline: 'none'
                }}
                autoFocus
              />
            ) : (
              <>
                <span style={{ flexGrow: 1, textAlign: 'center', padding: '0 4px' }}>
                  {node.label}
                </span>
                {selectedNode === node.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#94a3b8',
              textAlign: 'center'
            }}
          >
            <p>ノードを追加して樹形図を作成しましょう</p>
            <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
              ノードをクリックして選択し、別のノードをクリックすると線で接続されます
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
        <p>• クリックでノード選択、ダブルクリックで編集</p>
        <p>• 2つのノードを順番にクリックすると線で接続されます</p>
        <p>• ドラッグでノードを移動できます</p>
      </div>
    </div>
  );
};

export default TreeEditor;