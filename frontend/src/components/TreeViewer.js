import React from 'react';
import { BookOpen } from 'lucide-react';

const TreeViewer = ({ treeData, onNodeClickScroll }) => {
  // 階層型データの場合
  if (treeData.hierarchyLevels && treeData.hierarchyLevels.length > 0) {
    return (
      <HierarchicalTreeViewer 
        hierarchyLevels={treeData.hierarchyLevels} 
        onNodeClickScroll={onNodeClickScroll}
      />
    );
  }
  
  // 従来型ノードデータの場合
  if (treeData.nodes && treeData.nodes.length > 0) {
    return (
      <LegacyTreeViewer 
        nodes={treeData.nodes} 
        edges={treeData.edges}
        onNodeClickScroll={onNodeClickScroll}
      />
    );
  }

  return (
    <div className="tree-viewer-empty">
      <p>学習構造が設定されていません</p>
    </div>
  );
};

const HierarchicalTreeViewer = ({ hierarchyLevels, onNodeClickScroll }) => {
  // 改良されたノード位置計算（階層ごとに高さを統一）
  const calculateNodePositions = () => {
    const positions = {};
    const canvasWidth = 800;
    const canvasHeight = 500;
    const minDistance = 120; // ノード間の最小距離
    const levelHeight = 130; // 各階層間の垂直距離
    
    hierarchyLevels.forEach((level, levelIndex) => {
      // 各階層の基準Y座標を計算
      const baseY = 60 + levelIndex * levelHeight;
      
      if (levelIndex === 0) {
        // 最初の階層（ルートノード）は中央上部に配置
        level.nodes.forEach((node, nodeIndex) => {
          positions[node.id] = {
            x: canvasWidth / 2 - 40, // ノードサイズの半分を引いて中央揃え
            y: baseY
          };
        });
      } else {
        // 親ノードごとにグループ化して配置
        const parentGroups = {};
        
        // 親ノードごとに子ノードをグループ化
        level.nodes.forEach(node => {
          if (!parentGroups[node.parentId]) {
            parentGroups[node.parentId] = [];
          }
          parentGroups[node.parentId].push(node);
        });
        
        // 各親グループの子ノードを配置
        Object.keys(parentGroups).forEach(parentId => {
          const parentPos = positions[parentId];
          if (!parentPos) return;
          
          const siblings = parentGroups[parentId];
          const siblingCount = siblings.length;
          
          siblings.forEach((node, siblingIndex) => {
            if (siblingCount === 1) {
              // 子ノードが1つの場合は親の真下（同じX座標）に配置
              positions[node.id] = {
                x: parentPos.x,
                y: baseY // 階層の基準高さに配置
              };
            } else {
              // 複数の子ノードの場合は親を中心とした水平方向の放射状配置
              const maxAngle = Math.min(35, 20 + siblingCount * 3); // 最大35度
              const angleStep = siblingCount > 1 ? (maxAngle * 2) / (siblingCount - 1) : 0;
              const startAngle = -maxAngle;
              const angle = startAngle + (siblingIndex * angleStep);
              
              // 角度をラジアンに変換
              const radians = (angle * Math.PI) / 180;
              
              // 水平距離を計算（垂直方向は階層の基準高さに固定）
              let horizontalDistance = 140 + Math.max(0, (siblingCount - 2) * 20);
              
              // 新しい位置を計算（Y座標は階層の基準高さに固定）
              let newX = parentPos.x + Math.sin(radians) * horizontalDistance;
              let newY = baseY; // 階層の基準高さに固定
              
              // 水平方向の重複チェックと調整
              let attempts = 0;
              while (attempts < 10) {
                let tooClose = false;
                
                // 同じ階層の既存のノードとの距離をチェック
                for (const existingId in positions) {
                  const existingPos = positions[existingId];
                  // 同じ階層（同じY座標）のノードのみをチェック
                  if (existingId !== node.id && Math.abs(existingPos.y - newY) < 20) {
                    const distance = Math.abs(newX - existingPos.x);
                    
                    if (distance < minDistance) {
                      tooClose = true;
                      break;
                    }
                  }
                }
                
                if (!tooClose) {
                  break;
                }
                
                // 重複している場合は水平距離を増やす
                horizontalDistance += 25;
                newX = parentPos.x + Math.sin(radians) * horizontalDistance;
                attempts++;
              }
              
              // キャンバス境界内に収める
              newX = Math.max(50, Math.min(canvasWidth - 50, newX));
              
              positions[node.id] = { x: newX, y: newY };
            }
          });
        });
      }
    });
    
    return positions;
  };

  const nodePositions = calculateNodePositions();
  
  // 接続線を計算（改良版）
  const calculateConnections = () => {
    const connections = [];
    
    hierarchyLevels.forEach((level, levelIndex) => {
      if (levelIndex === 0) return; // 最上位階層はスキップ
      
      level.nodes.forEach(node => {
        if (node.parentId && nodePositions[node.parentId] && nodePositions[node.id]) {
          const parentPos = nodePositions[node.parentId];
          const childPos = nodePositions[node.id];
          
          // ノードの中心から接続線を引く
          const parentCenterX = parentPos.x + 40;
          const parentCenterY = parentPos.y + 40;
          const childCenterX = childPos.x + 40;
          const childCenterY = childPos.y + 40;
          
          // ノードのエッジから接続線を開始/終了するように調整
          const angle = Math.atan2(childCenterY - parentCenterY, childCenterX - parentCenterX);
          
          const fromX = parentCenterX + Math.cos(angle) * 40;
          const fromY = parentCenterY + Math.sin(angle) * 40;
          const toX = childCenterX - Math.cos(angle) * 40;
          const toY = childCenterY - Math.sin(angle) * 40;
          
          connections.push({
            from: { x: fromX, y: fromY },
            to: { x: toX, y: toY }
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
            style={{ top: `${60 + index * 130 + 10}px` }} // levelHeightに合わせて調整
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
              onNodeClickScroll={onNodeClickScroll}
            />
          ))
        )}
      </div>
    </div>
  );
};

const TreeViewerNode = ({ node, levelIndex, position, onNodeClickScroll }) => {
  if (!position) return null;

  const handleClick = () => {
    if (onNodeClickScroll) {
      console.log('TreeViewerNode clicked:', node.label);
      onNodeClickScroll(node);
    }
  };

  const nodeSize = (node.size || 50) * 0.8; // ノードサイズを動的に調整

  return (
    <div
      className={`tree-viewer-node level-${levelIndex} ${onNodeClickScroll ? 'clickable' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${nodeSize}px`,
        height: `${nodeSize}px`
      }}
      onClick={onNodeClickScroll ? handleClick : undefined}
      title={onNodeClickScroll ? `「${node.label}」の見出しにスクロール` : undefined}
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
        <div className="node-content">
          <span 
            className="node-text"
            style={{
              fontSize: `${Math.max(10, nodeSize / 6)}px`,
              maxWidth: `${nodeSize - 16}px`
            }}
          >
            {node.label}
          </span>
        </div>
      </div>
      
      {/* 閲覧モード用のスクロールアイコン */}
      {onNodeClickScroll && (
        <div className="viewer-node-indicator">
          <BookOpen size={12} />
        </div>
      )}
    </div>
  );
};

const LegacyTreeViewer = ({ nodes, edges, onNodeClickScroll }) => {
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
            className={`legacy-tree-node ${onNodeClickScroll ? 'clickable' : ''}`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`
            }}
            onClick={onNodeClickScroll ? () => onNodeClickScroll(node) : undefined}
            title={onNodeClickScroll ? `「${node.label}」の見出しにスクロール` : undefined}
          >
            <div className="node-circle">
              <span className="node-text">{node.label}</span>
            </div>
            {onNodeClickScroll && (
              <div className="viewer-node-indicator">
                <BookOpen size={12} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeViewer;