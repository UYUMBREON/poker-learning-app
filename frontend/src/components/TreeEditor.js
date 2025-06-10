import React, { useState } from 'react';
import { Plus, X, BookOpen, Palette, Maximize2 } from 'lucide-react';
import { useHierarchicalTreeEditor } from '../hooks/useTreeEditor';
import { COLOR_PALETTE } from '../utils/constants';

const TreeEditor = ({ treeData, onChange, onChapterFocus, onNodeClickScroll }) => {
  const {
    hierarchyLevels,
    edges,
    selectedNode,
    selectedEdge,
    editingNode,
    editingEdge,
    editValue,
    edgeEditValue,
    setEditValue,
    setEdgeEditValue,
    addChildNode,
    deleteNode,
    handleNodeClick,
    handleEdgeClick,
    startEditing,
    startEditingEdge,
    finishEditing,
    finishEditingEdge,
    cancelEditing,
    handleKeyPress,
    updateLevelName,
    updateNodeColor,
    updateNodeSize,
    updateEdgeLabel,
    toggleLevelCollapse,
    focusChapter
  } = useHierarchicalTreeEditor(treeData, onChange, onChapterFocus);

  return (
    <div className="visual-tree-editor">
      <TreeCanvas 
        hierarchyLevels={hierarchyLevels}
        edges={edges}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        editingNode={editingNode}
        editingEdge={editingEdge}
        editValue={editValue}
        edgeEditValue={edgeEditValue}
        onEditValueChange={setEditValue}
        onEdgeEditValueChange={setEdgeEditValue}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onStartEditing={startEditing}
        onStartEditingEdge={startEditingEdge}
        onFinishEditing={finishEditing}
        onFinishEditingEdge={finishEditingEdge}
        onCancelEditing={cancelEditing}
        onKeyPress={handleKeyPress}
        onAddChild={addChildNode}
        onDeleteNode={deleteNode}
        onUpdateLevelName={updateLevelName}
        onUpdateNodeColor={updateNodeColor}
        onUpdateNodeSize={updateNodeSize}
        onUpdateEdgeLabel={updateEdgeLabel}
        onToggleLevelCollapse={toggleLevelCollapse}
        onFocusChapter={focusChapter}
        onNodeClickScroll={onNodeClickScroll}
      />
    </div>
  );
};

const TreeCanvas = ({
  hierarchyLevels,
  edges,
  selectedNode,
  selectedEdge,
  editingNode,
  editingEdge,
  editValue,
  edgeEditValue,
  onEditValueChange,
  onEdgeEditValueChange,
  onNodeClick,
  onEdgeClick,
  onStartEditing,
  onStartEditingEdge,
  onFinishEditing,
  onFinishEditingEdge,
  onCancelEditing,
  onKeyPress,
  onAddChild,
  onDeleteNode,
  onUpdateLevelName,
  onUpdateNodeColor,
  onUpdateNodeSize,
  onUpdateEdgeLabel,
  onToggleLevelCollapse,
  onFocusChapter,
  onNodeClickScroll
}) => {
  // ノード位置を計算
  const calculateNodePositions = () => {
    const positions = {};
    const levelSpacing = 120;
    const nodeSpacing = 140;
    
    hierarchyLevels.forEach((level, levelIndex) => {
      const y = 80 + levelIndex * levelSpacing;
      const totalWidth = level.nodes.length * nodeSpacing;
      const startX = Math.max(60, (800 - totalWidth) / 2);
      
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
    
    edges.forEach(edge => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      
      if (sourcePos && targetPos) {
        const sourceNode = hierarchyLevels.flatMap(l => l.nodes).find(n => n.id === edge.source);
        const targetNode = hierarchyLevels.flatMap(l => l.nodes).find(n => n.id === edge.target);
        
        const sourceSize = (sourceNode?.size || 50) * 0.8;
        const targetSize = (targetNode?.size || 50) * 0.8;
        
        connections.push({
          ...edge,
          from: { x: sourcePos.x + sourceSize / 2, y: sourcePos.y + sourceSize },
          to: { x: targetPos.x + targetSize / 2, y: targetPos.y },
          midX: (sourcePos.x + targetPos.x) / 2 + (sourceSize + targetSize) / 4,
          midY: (sourcePos.y + targetPos.y) / 2 + sourceSize / 2
        });
      }
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
          <g key={conn.id || index}>
            <line
              x1={conn.from.x}
              y1={conn.from.y}
              x2={conn.to.x}
              y2={conn.to.y}
              stroke={selectedEdge === conn.id ? "#f59e0b" : "#94a3b8"}
              strokeWidth={selectedEdge === conn.id ? "3" : "2"}
              style={{ cursor: 'pointer' }}
              onClick={() => onEdgeClick(conn)}
            />
            {/* エッジラベル表示 */}
            {conn.label && (
              <text
                x={conn.midX}
                y={conn.midY}
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => onEdgeClick(conn)}
              >
                {conn.label}
              </text>
            )}
          </g>
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
              onUpdateNodeColor={onUpdateNodeColor}
              onUpdateNodeSize={onUpdateNodeSize}
              onFocusChapter={onFocusChapter}
              onNodeClickScroll={onNodeClickScroll}
            />
          ))
        )}
      </div>
      
      {/* エッジ編集UI */}
      {selectedEdge && (
        <EdgeEditor
          edge={edges.find(e => e.id === selectedEdge)}
          isEditing={editingEdge === selectedEdge}
          editValue={edgeEditValue}
          onEditValueChange={onEdgeEditValueChange}
          onStartEditing={onStartEditingEdge}
          onFinishEditing={onFinishEditingEdge}
          onCancelEditing={onCancelEditing}
          onKeyPress={onKeyPress}
        />
      )}
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
  onUpdateNodeColor,
  onUpdateNodeSize,
  onFocusChapter,
  onNodeClickScroll
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [sizeInput, setSizeInput] = useState(node.size || 50);

  if (!position) return null;

  const nodeSize = (node.size || 50) * 0.8; // 実際の表示サイズ

  const handleSizeChange = (newSize) => {
    const size = Math.min(Math.max(parseInt(newSize) || 50, 1), 100);
    setSizeInput(size);
    onUpdateNodeSize(node.id, size);
  };

  return (
    <div
      className={`visual-tree-node ${isSelected ? 'selected' : ''} level-${levelIndex}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${nodeSize}px`,
        height: `${nodeSize}px`
      }}
      onClick={() => onNodeClick(node)}
    >
      <div 
        className="node-circle"
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          backgroundColor: node.color || '#3B82F6',
          borderColor: node.color || '#3B82F6'
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={onKeyPress}
            className="node-edit-input"
            style={{
              width: `${nodeSize - 16}px`,
              height: `${nodeSize - 16}px`,
              fontSize: `${Math.max(10, nodeSize / 6)}px`
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="node-content"
            onDoubleClick={() => onStartEditing(node)}
            style={{
              fontSize: `${Math.max(10, nodeSize / 6)}px`,
              padding: `${nodeSize / 10}px`
            }}
          >
            <span className="node-text">{node.label}</span>
          </div>
        )}
      </div>
      
      {/* ノードアクション - 右側に配置 */}
      {isSelected && !isEditing && (
        <div className="node-actions-right">
          <button
            className="action-button add-button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('子ノード追加ボタンがクリックされました:', node.id);
              onAddChild(node.id);
            }}
            title="子要素を追加"
          >
            <Plus size={12} />
          </button>
          
          <button
            className="action-button color-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
              setShowSizePicker(false);
            }}
            title="色を変更"
          >
            <Palette size={12} />
          </button>
          
          <button
            className="action-button size-button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSizePicker(!showSizePicker);
              setShowColorPicker(false);
            }}
            title="サイズを変更"
          >
            <Maximize2 size={12} />
          </button>
          
          <button
            className="action-button scroll-button"
            onClick={(e) => {
              e.stopPropagation();
              if (onNodeClickScroll) {
                onNodeClickScroll(node);
              }
            }}
            title="該当見出しにスクロール"
          >
            <BookOpen size={12} />
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
                console.log('ノード削除ボタンがクリックされました:', node.id);
                onDeleteNode(node.id);
              }}
              title="このノードを削除"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
      
      {/* カラーピッカー - 右側に配置 */}
      {showColorPicker && (
        <div 
          className="color-picker-panel-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="color-picker-header">
            <span>色を選択</span>
            <button
              className="close-picker"
              onClick={() => setShowColorPicker(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="color-options">
            {COLOR_PALETTE.map(color => (
              <button
                key={color.code}
                className={`color-option ${node.color === color.code ? 'selected' : ''}`}
                style={{ backgroundColor: color.code }}
                onClick={() => {
                  onUpdateNodeColor(node.id, color.code);
                  setShowColorPicker(false);
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* サイズピッカー - 右側に配置 */}
      {showSizePicker && (
        <div 
          className="size-picker-panel-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="size-picker-header">
            <span>サイズ (1-100)</span>
            <button
              className="close-picker"
              onClick={() => setShowSizePicker(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="size-controls">
            <input
              type="range"
              min="1"
              max="100"
              value={sizeInput}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="size-slider"
            />
            <input
              type="number"
              min="1"
              max="100"
              value={sizeInput}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="size-input"
            />
          </div>
          <div className="size-preview">
            プレビュー: {sizeInput}
          </div>
        </div>
      )}
    </div>
  );
};

const EdgeEditor = ({
  edge,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onKeyPress
}) => {
  if (!edge) return null;

  return (
    <div className="edge-editor-panel">
      <div className="edge-editor-header">
        <span>エッジラベル編集</span>
        <button
          className="close-editor"
          onClick={onCancelEditing}
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="edge-editor-content">
        {isEditing ? (
          <div className="edge-edit-form">
            <input
              type="text"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onBlur={onFinishEditing}
              onKeyDown={onKeyPress}
              placeholder="エッジの名前を入力..."
              className="edge-label-input"
              autoFocus
            />
            <div className="edge-edit-actions">
              <button onClick={onFinishEditing} className="save-edge-button">
                保存
              </button>
              <button onClick={onCancelEditing} className="cancel-edge-button">
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="edge-display">
            <div className="edge-info">
              <span className="edge-label">
                {edge.label || '(ラベルなし)'}
              </span>
            </div>
            <button
              className="edit-edge-button"
              onClick={() => onStartEditing(edge)}
            >
              編集
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeEditor;