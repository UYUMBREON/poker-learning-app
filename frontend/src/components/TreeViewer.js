import React from 'react';

const TreeViewer = ({ treeData }) => {
  // 階層型データの場合
  if (treeData.hierarchyLevels && treeData.hierarchyLevels.length > 0) {
    return <HierarchicalTreeViewer hierarchyLevels={treeData.hierarchyLevels} />;
  }
  
  // 従来型ノードデータの場合
  if (treeData.nodes && treeData.nodes.length > 0) {
    return <LegacyTreeViewer nodes={treeData.nodes} edges={treeData.edges} />;
  }

  return (
    <div className="tree-viewer-empty">
      <p>学習構造が設定されていません</p>
    </div>
  );
};

const HierarchicalTreeViewer = ({ hierarchyLevels }) => {
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
    <div className="tree-viewer-container">
      {/* 階層名表示 */}
      <div className="level-labels">
        {hierarchyLevels.map((level, index) => (
          <div 
            key={index}
            className="level-label readonly" 
            style={{ top: `${80 + index * 120 + 10}px` }}
          >
            <span className="level-label-text">
              {level.name}
            </span>
          </div>
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
            <TreeViewerNode
              key={node.id}
              node={node}
              levelIndex={levelIndex}
              position={nodePositions[node.id]}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TreeViewerNode = ({ node, levelIndex, position }) => {
  if (!position) return null;

  return (
    <div
      className={`tree-viewer-node level-${levelIndex}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="node-circle">
        <div className="node-content">
          <span className="node-text">{node.label}</span>
        </div>
      </div>
    </div>
  );
};

const LegacyTreeViewer = ({ nodes, edges }) => {
  return (
    <div className="legacy-tree-viewer">
      <svg className="tree-svg" width="100%" height="400">
        {/* エッジを描画 */}
        {edges && edges.map(edge => {
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
            />
          );
        })}
      </svg>
      
      {/* ノードを描画 */}
      <div className="nodes-container">
        {nodes.map(node => (
          <div
            key={node.id}
            className="legacy-tree-node"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`
            }}
          >
            <div className="node-circle">
              <span className="node-text">{node.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeViewer;