import { useState, useCallback } from 'react';
import { 
  generateNodeId, 
  generateEdgeId, 
  createDefaultTreeNode 
} from '../utils/constants';

export const useTreeEditor = (initialTreeData = { nodes: [], edges: [] }, onChange) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const nodes = initialTreeData?.nodes || [];
  const edges = initialTreeData?.edges || [];

  // ノード追加
  const addNode = useCallback(() => {
    const newNode = createDefaultTreeNode(
      Math.random() * 300 + 50,
      Math.random() * 200 + 50
    );

    const newTreeData = {
      nodes: [...nodes, newNode],
      edges: [...edges]
    };

    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  // ノード削除
  const deleteNode = useCallback((nodeId) => {
    const newTreeData = {
      nodes: nodes.filter(node => node.id !== nodeId),
      edges: edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      )
    };
    onChange?.(newTreeData);
    setSelectedNode(null);
  }, [nodes, edges, onChange]);

  // ノードラベル更新
  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    const newTreeData = {
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, label: newLabel } : node
      ),
      edges: [...edges]
    };
    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  // ノード位置更新
  const updateNodePosition = useCallback((nodeId, x, y) => {
    const newTreeData = {
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, x, y } : node
      ),
      edges: [...edges]
    };
    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  // ノード接続
  const connectNodes = useCallback((sourceId, targetId) => {
    // 既存の接続をチェック
    const existingEdge = edges.find(edge => 
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
    
    if (existingEdge) return;

    const newEdge = {
      id: generateEdgeId(sourceId, targetId),
      source: sourceId,
      target: targetId
    };

    const newTreeData = {
      nodes: [...nodes],
      edges: [...edges, newEdge]
    };
    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  // ノードクリック処理
  const handleNodeClick = useCallback((node, e) => {
    e.stopPropagation();
    
    if (selectedNode && selectedNode !== node.id) {
      // 2つのノードを接続
      connectNodes(selectedNode, node.id);
      setSelectedNode(null);
    } else {
      setSelectedNode(selectedNode === node.id ? null : node.id);
    }
  }, [selectedNode, connectNodes]);

  // ノードドラッグ処理
  const handleNodeDrag = useCallback((node, e) => {
    const rect = e.currentTarget.closest('.tree-canvas').getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 25;
    updateNodePosition(node.id, Math.max(0, x), Math.max(0, y));
  }, [updateNodePosition]);

  // 編集開始
  const startEditing = useCallback((node) => {
    setEditingNode(node.id);
    setEditValue(node.label);
  }, []);

  // 編集完了
  const finishEditing = useCallback(() => {
    if (editingNode && editValue.trim()) {
      updateNodeLabel(editingNode, editValue.trim());
    }
    setEditingNode(null);
    setEditValue('');
  }, [editingNode, editValue, updateNodeLabel]);

  // 編集キャンセル
  const cancelEditing = useCallback(() => {
    setEditingNode(null);
    setEditValue('');
  }, []);

  // キーボード処理
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [finishEditing, cancelEditing]);

  // キャンバスクリック処理
  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return {
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
  };
};