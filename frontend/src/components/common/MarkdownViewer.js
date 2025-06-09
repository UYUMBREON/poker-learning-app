import React from 'react';

// Markdownライブラリが利用できない場合の代替実装
const MarkdownViewer = ({ content, className = "" }) => {
  if (!content || !content.trim()) {
    return (
      <div className={`markdown-viewer empty-content ${className}`}>
        <p className="empty-message">内容がありません</p>
      </div>
    );
  }

  // 簡易Markdownパーサー
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
    
    // 3. 見出しを処理（段落処理の前に）
    html = html.replace(/^#{6}\s+(.*$)/gm, '<h6 class="markdown-h6">$1</h6>');
    html = html.replace(/^#{5}\s+(.*$)/gm, '<h5 class="markdown-h5">$1</h5>');
    html = html.replace(/^#{4}\s+(.*$)/gm, '<h4 class="markdown-h4">$1</h4>');
    html = html.replace(/^#{3}\s+(.*$)/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^#{2}\s+(.*$)/gm, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^#{1}\s+(.*$)/gm, '<h1 class="markdown-h1">$1</h1>');
    
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
    
    // 7. リンクを処理（イベントハンドラーで外部リンクのみ処理）
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
      return `<p class="markdown-paragraph">${trimmed.replace(/\n/g, '<br>')}</p>`;
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
    
    // リンクを復元
    links.forEach((link, index) => {
      const placeholder = `__LINK_${index}__`;
      const isExternal = link.url.startsWith('http://') || link.url.startsWith('https://');
      html = html.replace(placeholder, 
        `<a href="${link.url}" class="markdown-link" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>${link.text}</a>`
      );
    });
    
    return html;
  };

  const htmlContent = parseMarkdown(content);

  // リンククリック時の処理
  const handleClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A' && target.classList.contains('markdown-link')) {
      const href = target.getAttribute('href');
      // 外部リンクまたは絶対URLの場合のみデフォルト動作を許可
      if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
        // デフォルト動作を許可（新しいタブで開く）
        return;
      }
      // 内部リンクの場合はイベントを停止（Reactルーターに干渉しないように）
      e.preventDefault();
      console.warn('相対リンクは現在サポートされていません:', href);
    }
  };

  return (
    <div 
      className={`markdown-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      onClick={handleClick}
    />
  );
};

export default MarkdownViewer;