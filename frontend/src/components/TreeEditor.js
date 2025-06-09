import React from 'react';
import { Plus, X } from 'lucide-react';
import { useHierarchicalTreeEditor } from '../hooks/useTreeEditor';

const TreeEditor = ({ treeData, onChange, onChapterFocus }) => {
  const {
    hierarchyLevels,
    selectedNode,
    editingNode,
    editValue,
    setEditValue,
    addChildNode,
    deleteNode,
    handleNodeClick,
    startEditing,
    finishEditing,
    cancelEditing,
    handleKeyPress,
    updateLevelName,
    toggleLevelCollapse,
    focusChapter
  } = useHierarchicalTreeEditor(treeData, onChange, onChapterFocus);

  return (
    <div className="visual-tree-editor">
      <TreeCanvas 
        hierarchyLevels={hierarchyLevels}
        selectedNode={selectedNode}
        editingNode={editingNode}
        editValue={editValue}
        onEditValueChange={setEditValue}
        onNodeClick={handleNodeClick}
        onStartEditing={startEditing}
        onFinishEditing={finishEditing}
        onCancelEditing={cancelEditing}
        onKeyPress={handleKeyPress}
        onAddChild={addChildNode}
        onDeleteNode={deleteNode}
        onUpdateLevelName={updateLevelName}
        onToggleLevelCollapse={toggleLevelCollapse}
        onFocusChapter={focusChapter}
      />
    </div>
  );
};

const TreeCanvas = ({
  hierarchyLevels,
  selectedNode,
  editingNode,
  editValue,
  onEditValueChange,
  onNodeClick,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress,
  onAddChild,
  onDeleteNode,
  onUpdateLevelName,
  onToggleLevelCollapse,
  onFocusChapter
}) => {
  // ノード位置を計算
  const calculateNodePositions = () => {
    const positions = {};
    const levelSpacing = 120; // 階層間の垂直間隔
    const nodeSpacing = 140; // 同一階層内の水平間隔
    
    hierarchyLevels.forEach((level, levelIndex) => {
      const y = 80 + levelIndex * levelSpacing;
      const totalWidth = level.nodes.length * nodeSpacing;
      const startX = Math.max(60, (800 - totalWidth) / 2); // 中央寄せ
      
      level.nodes.forEach((node, nodeIndex) => {
        positions[node.id] = {
          x: startX + nodeIndex * nodeSpacing,
          y: y
        };
      });
    });
    
    return positions;
  };

  const nodePositions = calculateNodePositions();
  
  // 接続線を計算
  const calculateConnections = () => {
    const connections = [];
    
    hierarchyLevels.forEach((level, levelIndex) => {
      if (levelIndex === 0) return; // 最上位階層はスキップ
      
      level.nodes.forEach(node => {
        if (node.parentId && nodePositions[node.parentId] && nodePositions[node.id]) {
          const parent = nodePositions[node.parentId];
          const child = nodePositions[node.id];
          connections.push({
            from: { x: parent.x + 40, y: parent.y + 40 },
            to: { x: child.x + 40, y: child.y }
          });
        }
      });
    });
    
    return connections;
  };

  const connections = calculateConnections();

  return (
    <div className="tree-canvas-container">
      {/* 階層名表示 */}
      <div className="level-labels">
        {hierarchyLevels.map((level, index) => (
          <LevelLabel 
            key={index}
            level={level}
            levelIndex={index}
            y={80 + index * 120}
            onUpdateLevelName={onUpdateLevelName}
          />
        ))}
      </div>
      
      {/* SVGキャンバス */}
      <svg className="tree-svg" width="100%" height="100%">
        {/* 接続線を描画 */}
        {connections.map((conn, index) => (
          <line
            key={index}
            x1={conn.from.x}
            y1={conn.from.y}
            x2={conn.to.x}
            y2={conn.to.y}
            stroke="#94a3b8"
            strokeWidth="2"
          />
        ))}
      </svg>
      
      {/* ノード表示 */}
      <div className="nodes-container">
        {hierarchyLevels.flatMap((level, levelIndex) =>
          level.nodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              levelIndex={levelIndex}
              position={nodePositions[node.id]}
              isSelected={selectedNode === node.id}
              isEditing={editingNode === node.id}
              editValue={editValue}
              onEditValueChange={onEditValueChange}
              onNodeClick={onNodeClick}
              onStartEditing={onStartEditing}
              onFinishEditing={onFinishEditing}
              onCancelEditing={onCancelEditing}
              onKeyPress={onKeyPress}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              onFocusChapter={onFocusChapter}
            />
          ))
        )}
      </div>
    </div>
  );
};

const LevelLabel = ({ level, levelIndex, y, onUpdateLevelName }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(level.name);

  const handleSave = () => {
    onUpdateLevelName(levelIndex, editValue.trim() || `階層${levelIndex + 1}`);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(level.name);
    setIsEditing(false);
  };

  return (
    <div 
      className="level-label" 
      style={{ top: `${y + 10}px` }}
    >
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="level-label-input"
          autoFocus
        />
      ) : (
        <span 
          className="level-label-text"
          onDoubleClick={() => setIsEditing(true)}
        >
          {level.name}
        </span>
      )}
    </div>
  );
};

const TreeNode = ({
  node,
  levelIndex,
  position,
  isSelected,
  isEditing,
  editValue,
  onEditValueChange,
  onNodeClick,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress,
  onAddChild,
  onDeleteNode,
  onFocusChapter
}) => {
  if (!position) return null;

  return (
    <div
      className={`visual-tree-node ${isSelected ? 'selected' : ''} level-${levelIndex}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onClick={() => onNodeClick(node)}
    >
      <div className="node-circle">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={onKeyPress}
            className="node-edit-input"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="node-content"
            onDoubleClick={() => onStartEditing(node)}
          >
            <span className="node-text">{node.label}</span>
          </div>
        )}
      </div>
      
      {/* ノードアクション */}
      {isSelected && !isEditing && (
        <div className="node-actions">
          <button
            className="action-button add-button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            title="子要素を追加"
          >
            <Plus size={12} />
          </button>
          <button
            className="action-button focus-button"
            onClick={(e) => {
              e.stopPropagation();
              onFocusChapter(node);
            }}
            title="この章にフォーカス"
          >
            📝
          </button>
          {levelIndex > 0 && (
            <button
              className="action-button delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              title="このノードを削除"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TreeEditor;