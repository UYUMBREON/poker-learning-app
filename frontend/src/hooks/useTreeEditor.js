import { useState, useCallback, useMemo, useEffect } from 'react';
import { generateNodeId } from '../utils/constants';

// 階層型ツリーエディター用フック（拡張版）
export const useHierarchicalTreeEditor = (initialTreeData = { nodes: [], hierarchyLevels: [] }, onChange, onChapterFocus) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const [edgeEditValue, setEdgeEditValue] = useState('');

  // 初期データの処理
  const initializeHierarchy = useCallback(() => {
    if (initialTreeData.hierarchyLevels && initialTreeData.hierarchyLevels.length > 0) {
      return initialTreeData.hierarchyLevels;
    }
    
    // 従来のnodes形式からhierarchyLevels形式に変換、または初期データを作成
    if (initialTreeData.nodes && initialTreeData.nodes.length > 0) {
      // 既存のnodesを階層構造に変換（簡易的な変換）
      return [
        {
          name: 'メイン',
          collapsed: false,
          nodes: initialTreeData.nodes.map(node => ({
            ...node,
            level: 0,
            parentId: null,
            hasChildren: false,
            color: node.color || '#3B82F6', // デフォルト色
            size: node.size || 50 // デフォルトサイズ
          }))
        }
      ];
    }

    // 完全に新しい場合は、ルートノードを持つ最初の階層を作成
    const rootNode = {
      id: generateNodeId(),
      label: 'メインテーマ',
      level: 0,
      parentId: null,
      hasChildren: false,
      color: '#3B82F6',
      size: 50
    };

    return [
      {
        name: 'メイン',
        collapsed: false,
        nodes: [rootNode]
      }
    ];
  }, [initialTreeData]);

  const [hierarchyLevels, setHierarchyLevels] = useState(() => initializeHierarchy());
  const [edges, setEdges] = useState(() => initialTreeData.edges || []);

  // データが変更された時にhierarchyLevelsを更新
  useEffect(() => {
    if (initialTreeData.hierarchyLevels) {
      setHierarchyLevels(initialTreeData.hierarchyLevels);
    }
    if (initialTreeData.edges) {
      setEdges(initialTreeData.edges);
    }
  }, [initialTreeData.hierarchyLevels, initialTreeData.edges]);

  // データ変更をonChangeで通知
  const notifyChange = useCallback((newHierarchyLevels, newEdges = edges) => {
    const treeData = {
      hierarchyLevels: newHierarchyLevels,
      edges: newEdges,
      // 後方互換性のためnodesも含める
      nodes: newHierarchyLevels.flatMap(level => level.nodes)
    };
    onChange?.(treeData);
  }, [onChange, edges]);

  // 子ノードを追加
  const addChildNode = useCallback((parentId) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      
      // 親ノードの階層を見つける
      let parentLevel = -1;
      let parentNodeIndex = -1;
      
      for (let i = 0; i < newLevels.length; i++) {
        const nodeIndex = newLevels[i].nodes.findIndex(n => n.id === parentId);
        if (nodeIndex !== -1) {
          parentLevel = i;
          parentNodeIndex = nodeIndex;
          break;
        }
      }
      
      if (parentLevel === -1) {
        console.log('親ノードが見つかりません:', parentId);
        return prevLevels;
      }
      
      console.log('親ノードが見つかりました:', { parentLevel, parentNodeIndex, parentId });
      
      // 親ノードにhasChildren = trueを設定
      newLevels[parentLevel].nodes[parentNodeIndex].hasChildren = true;
      
      // 次の階層を確保
      const childLevel = parentLevel + 1;
      if (childLevel >= newLevels.length) {
        newLevels.push({
          name: `レベル ${childLevel + 1}`,
          collapsed: false,
          nodes: []
        });
        console.log('新しい階層を作成しました:', childLevel);
      }
      
      // 新しい子ノードを作成
      const newNode = {
        id: generateNodeId(),
        label: '新しい項目',
        level: childLevel,
        parentId: parentId,
        hasChildren: false,
        color: '#3B82F6',
        size: 50
      };
      
      newLevels[childLevel].nodes.push(newNode);
      console.log('新しいノードを追加しました:', newNode);
      
      return newLevels;
    });

    // エッジを追加（setEdgesを直接呼び出し）
    setEdges(prevEdges => {
      const newEdgeId = `edge_${parentId}_${Date.now()}`;
      const newEdge = {
        id: newEdgeId,
        source: parentId,
        target: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 一時的なID
        label: ''
      };
      
      // 実際のノードIDで更新するために、少し後でもう一度処理
      setTimeout(() => {
        setHierarchyLevels(currentLevels => {
          // 最新のノードを見つけて、エッジのターゲットを更新
          const allNodes = currentLevels.flatMap(level => level.nodes);
          const newestNode = allNodes[allNodes.length - 1];
          if (newestNode && newestNode.parentId === parentId) {
            setEdges(currentEdges => 
              currentEdges.map(edge => 
                edge.id === newEdgeId 
                  ? { ...edge, target: newestNode.id }
                  : edge
              )
            );
          }
          return currentLevels;
        });
      }, 100);
      
      console.log('新しいエッジを追加しました:', newEdge);
      return [...prevEdges, newEdge];
    });
  }, []);

  // ノードを削除
  const deleteNode = useCallback((nodeId) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      
      // ノードとその子孫を削除
      const deleteNodeAndDescendants = (targetNodeId) => {
        // まず子ノードを見つけて削除
        for (let i = 1; i < newLevels.length; i++) {
          const childrenToDelete = newLevels[i].nodes.filter(n => n.parentId === targetNodeId);
          childrenToDelete.forEach(child => deleteNodeAndDescendants(child.id));
          newLevels[i].nodes = newLevels[i].nodes.filter(n => n.parentId !== targetNodeId);
        }
        
        // 対象のノード自体を削除
        for (let i = 0; i < newLevels.length; i++) {
          newLevels[i].nodes = newLevels[i].nodes.filter(n => n.id !== targetNodeId);
        }
        
        // 関連するエッジを削除
        setEdges(prevEdges => prevEdges.filter(edge => 
          edge.source !== targetNodeId && edge.target !== targetNodeId
        ));
      };
      
      deleteNodeAndDescendants(nodeId);
      
      // 親ノードのhasChildrenを更新
      for (let i = 0; i < newLevels.length - 1; i++) {
        newLevels[i].nodes.forEach(node => {
          const hasChildren = newLevels[i + 1].nodes.some(child => child.parentId === node.id);
          node.hasChildren = hasChildren;
        });
      }
      
      // 空の末尾階層を削除
      while (newLevels.length > 1 && newLevels[newLevels.length - 1].nodes.length === 0) {
        newLevels.pop();
      }
      
      return newLevels;
    });
    
    setSelectedNode(null);
  }, []);

  // ノードのラベルを更新
  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      
      for (let i = 0; i < newLevels.length; i++) {
        const nodeIndex = newLevels[i].nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          newLevels[i].nodes[nodeIndex] = {
            ...newLevels[i].nodes[nodeIndex],
            label: newLabel
          };
          break;
        }
      }
      
      return newLevels;
    });
  }, []);

  // ノードの色を更新
  const updateNodeColor = useCallback((nodeId, newColor) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      
      for (let i = 0; i < newLevels.length; i++) {
        const nodeIndex = newLevels[i].nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          newLevels[i].nodes[nodeIndex] = {
            ...newLevels[i].nodes[nodeIndex],
            color: newColor
          };
          break;
        }
      }
      
      return newLevels;
    });
  }, []);

  // ノードのサイズを更新
  const updateNodeSize = useCallback((nodeId, newSize) => {
    const size = Math.min(Math.max(parseInt(newSize) || 50, 1), 100);
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      
      for (let i = 0; i < newLevels.length; i++) {
        const nodeIndex = newLevels[i].nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          newLevels[i].nodes[nodeIndex] = {
            ...newLevels[i].nodes[nodeIndex],
            size: size
          };
          break;
        }
      }
      
      return newLevels;
    });
  }, []);

  // エッジのラベルを更新
  const updateEdgeLabel = useCallback((edgeId, newLabel) => {
    setEdges(prevEdges => 
      prevEdges.map(edge => 
        edge.id === edgeId 
          ? { ...edge, label: newLabel }
          : edge
      )
    );
  }, []);

  // 階層名を更新
  const updateLevelName = useCallback((levelIndex, newName) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      if (levelIndex < newLevels.length) {
        newLevels[levelIndex] = {
          ...newLevels[levelIndex],
          name: newName
        };
      }
      return newLevels;
    });
  }, []);

  // 階層の折りたたみ切り替え
  const toggleLevelCollapse = useCallback((levelIndex) => {
    setHierarchyLevels(prevLevels => {
      const newLevels = [...prevLevels];
      if (levelIndex < newLevels.length) {
        newLevels[levelIndex] = {
          ...newLevels[levelIndex],
          collapsed: !newLevels[levelIndex].collapsed
        };
      }
      return newLevels;
    });
  }, []);

  // ノードクリック処理
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
    setSelectedEdge(null); // ノード選択時はエッジ選択を解除
  }, [selectedNode]);

  // エッジクリック処理
  const handleEdgeClick = useCallback((edge) => {
    setSelectedEdge(selectedEdge === edge.id ? null : edge.id);
    setSelectedNode(null); // エッジ選択時はノード選択を解除
  }, [selectedEdge]);

  // 編集開始
  const startEditing = useCallback((node) => {
    setEditingNode(node.id);
    setEditValue(node.label);
  }, []);

  // エッジ編集開始
  const startEditingEdge = useCallback((edge) => {
    setEditingEdge(edge.id);
    setEdgeEditValue(edge.label || '');
  }, []);

  // 編集完了
  const finishEditing = useCallback(() => {
    if (editingNode && editValue.trim()) {
      updateNodeLabel(editingNode, editValue.trim());
    }
    setEditingNode(null);
    setEditValue('');
  }, [editingNode, editValue, updateNodeLabel]);

  // エッジ編集完了
  const finishEditingEdge = useCallback(() => {
    if (editingEdge) {
      updateEdgeLabel(editingEdge, edgeEditValue.trim());
    }
    setEditingEdge(null);
    setEdgeEditValue('');
  }, [editingEdge, edgeEditValue, updateEdgeLabel]);

  // 編集キャンセル
  const cancelEditing = useCallback(() => {
    setEditingNode(null);
    setEditValue('');
    setEditingEdge(null);
    setEdgeEditValue('');
  }, []);

  // キーボード処理
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      if (editingNode) {
        finishEditing();
      } else if (editingEdge) {
        finishEditingEdge();
      }
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [finishEditing, finishEditingEdge, cancelEditing, editingNode, editingEdge]);

  // 章にフォーカス
  const focusChapter = useCallback((node) => {
    onChapterFocus?.(node);
  }, [onChapterFocus]);

  // hierarchyLevelsまたはedgesが変更された時にonChangeを呼び出す
  useEffect(() => {
    notifyChange(hierarchyLevels, edges);
  }, [hierarchyLevels, edges, notifyChange]);

  return {
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
  };
};

// 従来のuseTreeEditorも保持（後方互換性のため）
export const useTreeEditor = (treeData, onChange) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');

  const nodes = useMemo(() => treeData?.nodes || [], [treeData?.nodes]);
  const edges = useMemo(() => treeData?.edges || [], [treeData?.edges]);

  const addNode = useCallback(() => {
    const newNode = {
      id: generateNodeId(),
      label: '新しいノード',
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      color: '#3B82F6',
      size: 50
    };

    const newTreeData = {
      nodes: [...nodes, newNode],
      edges: [...edges]
    };

    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

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

  const updateNodeLabel = useCallback((nodeId, newLabel) => {
    const newTreeData = {
      nodes: nodes.map(node => 
        node.id === nodeId ? { ...node, label: newLabel } : node
      ),
      edges: [...edges]
    };
    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  const handleNodeClick = useCallback((node, e) => {
    e.stopPropagation();
    setSelectedNode(selectedNode === node.id ? null : node.id);
  }, [selectedNode]);

  const handleNodeDrag = useCallback((node, e) => {
    const rect = e.currentTarget.closest('.tree-canvas').getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 25;
    
    const newTreeData = {
      nodes: nodes.map(n => 
        n.id === node.id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n
      ),
      edges: [...edges]
    };
    onChange?.(newTreeData);
  }, [nodes, edges, onChange]);

  const startEditing = useCallback((node) => {
    setEditingNode(node.id);
    setEditValue(node.label);
  }, []);

  const finishEditing = useCallback(() => {
    if (editingNode && editValue.trim()) {
      updateNodeLabel(editingNode, editValue.trim());
    }
    setEditingNode(null);
    setEditValue('');
  }, [editingNode, editValue, updateNodeLabel]);

  const cancelEditing = useCallback(() => {
    setEditingNode(null);
    setEditValue('');
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [finishEditing, cancelEditing]);

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