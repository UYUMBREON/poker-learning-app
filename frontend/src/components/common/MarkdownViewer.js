import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Markdownライブラリが利用できない場合の代替実装
const MarkdownViewer = ({ content, className = "" }) => {
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const navigate = useNavigate();

  // 見出しの展開・縮小を切り替える関数
  const toggleSection = (headingId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headingId)) {
        newSet.delete(headingId);
      } else {
        newSet.add(headingId);
      }
      return newSet;
    });
  };

  // 拡張Markdownパーサー
  const parseMarkdown = (text) => {
    let html = text;
    
    // エスケープHTML
    html = html.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
    
    // 1. コードブロックを最初に処理（他の処理を避けるため）
    const codeBlocks = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
      codeBlocks.push({
        lang: lang || 'text',
        code: code
      });
      return placeholder;
    });
    
    // 2. インラインコードを処理（コードブロックの後に）
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINECODE_${inlineCodes.length}__`;
      inlineCodes.push(code);
      return placeholder;
    });
    
    // 3. 見出しを処理（段落処理の前に）- 展開・縮小機能付き
    let headingCounter = 0;
    html = html.replace(/^#{6}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h6 class="markdown-h6 collapsible-heading" data-heading-id="${headingId}" data-level="6">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h6>`;
    });
    html = html.replace(/^#{5}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h5 class="markdown-h5 collapsible-heading" data-heading-id="${headingId}" data-level="5">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h5>`;
    });
    html = html.replace(/^#{4}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h4 class="markdown-h4 collapsible-heading" data-heading-id="${headingId}" data-level="4">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h4>`;
    });
    html = html.replace(/^#{3}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h3 class="markdown-h3 collapsible-heading" data-heading-id="${headingId}" data-level="3">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h3>`;
    });
    html = html.replace(/^#{2}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h2 class="markdown-h2 collapsible-heading" data-heading-id="${headingId}" data-level="2">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h2>`;
    });
    html = html.replace(/^#{1}\s+(.*$)/gm, (match, title) => {
      const headingId = `heading-${headingCounter++}`;
      return `<h1 class="markdown-h1 collapsible-heading" data-heading-id="${headingId}" data-level="1">
        <span class="heading-toggle">
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </span>
        <span class="heading-text">${title}</span>
      </h1>`;
    });
    
    // 4. 引用を処理
    html = html.replace(/^>\s+(.*$)/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');
    
    // 5. リストを処理
    // 番号付きリスト
    html = html.replace(/^\d+\.\s+(.*$)/gm, '<li class="markdown-list-item">$1</li>');
    // 箇条書きリスト  
    html = html.replace(/^[-*+]\s+(.*$)/gm, '<li class="markdown-list-item">$1</li>');
    
    // 連続するリスト項目をulタグで囲む
    html = html.replace(/(<li class="markdown-list-item">.*?<\/li>)(\s*<li class="markdown-list-item">.*?<\/li>)*/gs, (match) => {
      return `<ul class="markdown-list">${match}</ul>`;
    });
    
    // 6. 太字・斜体を処理
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="markdown-em">$1</em>');
    
    // 7. リンクを処理（改善版）
    const links = [];
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const placeholder = `__LINK_${links.length}__`;
      links.push({ text, url });
      return placeholder;
    });
    
    // 8. 水平線を処理
    html = html.replace(/^---+$/gm, '<hr class="markdown-divider">');
    
    // 9. 段落を処理（最後に）
    // 二重改行で段落分割
    const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim());
    html = paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();
      // 既にHTMLタグで始まっている場合は段落タグで囲まない
      if (trimmed.match(/^<(h[1-6]|blockquote|ul|ol|hr|pre)/)) {
        return trimmed.replace(/\n/g, ' ');
      }
      return `<div class="markdown-content">${trimmed.replace(/\n/g, '<br>')}</div>`;
    }).join('');
    
    // 10. プレースホルダーを実際のコンテンツに置換
    // コードブロックを復元
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODEBLOCK_${index}__`;
      html = html.replace(placeholder, 
        `<pre class="code-block"><code class="language-${block.lang}">${block.code}</code></pre>`
      );
    });
    
    // インラインコードを復元
    inlineCodes.forEach((code, index) => {
      const placeholder = `__INLINECODE_${index}__`;
      html = html.replace(placeholder, `<code class="inline-code">${code}</code>`);
    });
    
    // リンクを復元（改善版）
    links.forEach((link, index) => {
      const placeholder = `__LINK_${index}__`;
      const isExternal = link.url.startsWith('http://') || 
                        link.url.startsWith('https://') || 
                        link.url.startsWith('mailto:');
      
      if (isExternal) {
        html = html.replace(placeholder, 
          `<a href="${link.url}" class="markdown-link external-link" target="_blank" rel="noopener noreferrer">${link.text}</a>`
        );
      } else {
        // 内部リンクの場合はdata属性を使用
        html = html.replace(placeholder, 
          `<a href="${link.url}" class="markdown-link internal-link" data-url="${link.url}">${link.text}</a>`
        );
      }
    });
    
    return html;
  };

  // セクション構造を解析してDOM操作で展開・縮小を制御
  useEffect(() => {
    // コンテンツが空の場合は何もしない
    if (!content || !content.trim()) {
      return;
    }

    // 適切なセレクターを構築
    const viewerSelector = className ? `.${className.split(' ').join('.')}` : '.markdown-viewer';
    const viewer = document.querySelector(viewerSelector);
    if (!viewer) return;

    const headings = viewer.querySelectorAll('.collapsible-heading');
    
    headings.forEach(heading => {
      const headingId = heading.getAttribute('data-heading-id');
      const level = parseInt(heading.getAttribute('data-level'));
      const chevron = heading.querySelector('.chevron-icon');
      
      // セクションが縮小されているかチェック
      const isCollapsed = collapsedSections.has(headingId);
      
      // シェブロンの向きを更新
      if (chevron) {
        chevron.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
      }
      
      // 次の要素から次の同レベル以上の見出しまでを取得
      let nextElement = heading.nextElementSibling;
      const elementsToToggle = [];
      
      while (nextElement) {
        if (nextElement.classList.contains('collapsible-heading')) {
          const nextLevel = parseInt(nextElement.getAttribute('data-level'));
          if (nextLevel <= level) {
            break; // 同レベル以上の見出しに達したら終了
          }
        }
        elementsToToggle.push(nextElement);
        nextElement = nextElement.nextElementSibling;
      }
      
      // 要素の表示・非表示を制御
      elementsToToggle.forEach(element => {
        element.style.display = isCollapsed ? 'none' : '';
      });
    });
  }, [collapsedSections, className, content]);

  // リンククリック時とヘッダークリック時の処理
  const handleClick = (e) => {
    // 見出しクリック時の処理
    const headingElement = e.target.closest('.collapsible-heading');
    if (headingElement) {
      e.preventDefault();
      const headingId = headingElement.getAttribute('data-heading-id');
      toggleSection(headingId);
      return;
    }
    
    // リンククリック時の処理
    const linkElement = e.target.closest('.markdown-link');
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      
      // 外部リンクの場合はデフォルト動作を許可
      if (linkElement.classList.contains('external-link')) {
        // 外部リンクはデフォルト動作（新しいタブで開く）
        return;
      }
      
      // 内部リンクの場合
      if (linkElement.classList.contains('internal-link')) {
        e.preventDefault();
        
        // 絶対パスの場合
        if (href.startsWith('/')) {
          navigate(href);
          return;
        }
        
        // 相対パスの場合は現在のパスからの相対で処理
        // 現在のパスを取得してリンクを解決
        const currentPath = window.location.pathname;
        const resolvedPath = new URL(href, `${window.location.origin}${currentPath}`).pathname;
        navigate(resolvedPath);
        return;
      }
      
      // その他のリンクの場合は警告を表示
      e.preventDefault();
      console.warn('未対応のリンク形式:', href);
    }
  };

  const htmlContent = parseMarkdown(content);

  // コンテンツが空の場合の早期リターン
  if (!content || !content.trim()) {
    return (
      <div className={`markdown-viewer empty-content ${className}`}>
        <p className="empty-message">内容がありません</p>
      </div>
    );
  }

  return (
    <div 
      className={`markdown-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      onClick={handleClick}
    />
  );
};

export default MarkdownViewer;