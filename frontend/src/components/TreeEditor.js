import React from 'react';
import { Plus, X } from 'lucide-react';
import { useTreeEditor } from '../hooks/useTreeEditor';
import Button from './common/Button';

const TreeEditor = ({ treeData, onChange }) => {
  const {
    nodes,
    edges,
    selectedNode,
    editingNode,
    editValue,
    setEditValue,
    addNode,
    deleteNode,
    handleNodeClick,
    handleNodeDrag,
    startEditing,
    finishEditing,
    cancelEditing,
    handleKeyPress,
    handleCanvasClick
  } = useTreeEditor(treeData, onChange);

  return (
    <div className="tree-editor">
      <TreeControls onAddNode={addNode} />
      <TreeCanvas 
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        editingNode={editingNode}
        editValue={editValue}
        onEditValueChange={setEditValue}
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onStartEditing={startEditing}
        onFinishEditing={finishEditing}
        onCancelEditing={cancelEditing}
        onKeyPress={handleKeyPress}
        onCanvasClick={handleCanvasClick}
        onDeleteNode={deleteNode}
      />
      <TreeInstructions />
    </div>
  );
};

const TreeControls = ({ onAddNode }) => (
  <div style={{ marginBottom: '15px' }}>
    <Button
      variant="success"
      icon={Plus}
      onClick={onAddNode}
    >
      ノード追加
    </Button>
  </div>
);

const TreeCanvas = ({
  nodes,
  edges,
  selectedNode,
  editingNode,
  editValue,
  onEditValueChange,
  onNodeClick,
  onNodeDrag,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress,
  onCanvasClick,
  onDeleteNode
}) => (
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
    onClick={onCanvasClick}
  >
    <TreeEdges nodes={nodes} edges={edges} />
    <TreeNodes 
      nodes={nodes}
      selectedNode={selectedNode}
      editingNode={editingNode}
      editValue={editValue}
      onEditValueChange={onEditValueChange}
      onNodeClick={onNodeClick}
      onNodeDrag={onNodeDrag}
      onStartEditing={onStartEditing}
      onFinishEditing={onFinishEditing}
      onCancelEditing={onCancelEditing}
      onKeyPress={onKeyPress}
      onDeleteNode={onDeleteNode}
    />
    {nodes.length === 0 && <EmptyCanvasMessage />}
  </div>
);

const TreeEdges = ({ nodes, edges }) => (
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
    {edges.map(edge => {
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
    })}
  </svg>
);

const TreeNodes = ({
  nodes,
  selectedNode,
  editingNode,
  editValue,
  onEditValueChange,
  onNodeClick,
  onNodeDrag,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress,
  onDeleteNode
}) => (
  <>
    {nodes.map(node => (
      <TreeNode
        key={node.id}
        node={node}
        isSelected={selectedNode === node.id}
        isEditing={editingNode === node.id}
        editValue={editValue}
        onEditValueChange={onEditValueChange}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onStartEditing={onStartEditing}
        onFinishEditing={onFinishEditing}
        onCancelEditing={onCancelEditing}
        onKeyPress={onKeyPress}
        onDeleteNode={onDeleteNode}
      />
    ))}
  </>
);

const TreeNode = ({
  node,
  isSelected,
  isEditing,
  editValue,
  onEditValueChange,
  onNodeClick,
  onNodeDrag,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress,
  onDeleteNode
}) => (
  <div
    style={{
      position: 'absolute',
      left: `${node.x}px`,
      top: `${node.y}px`,
      width: '100px',
      height: '50px',
      background: isSelected ? '#3b82f6' : 'white',
      color: isSelected ? 'white' : '#334155',
      border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
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
    onClick={(e) => onNodeClick(node, e)}
    onDoubleClick={() => onStartEditing(node)}
    draggable
    onDragEnd={(e) => onNodeDrag(node, e)}
  >
    {isEditing ? (
      <input
        type="text"
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onBlur={onFinishEditing}
        onKeyDown={onKeyPress}
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
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
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
);

const EmptyCanvasMessage = () => (
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
);

const TreeInstructions = () => (
  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
    <p>• クリックでノード選択、ダブルクリックで編集</p>
    <p>• 2つのノードを順番にクリックすると線で接続されます</p>
    <p>• ドラッグでノードを移動できます</p>
  </div>
);

export default TreeEditor;