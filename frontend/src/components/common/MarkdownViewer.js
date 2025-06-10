import React from 'react';
import { useNavigate } from 'react-router-dom';

// Markdownライブラリが利用できない場合の代替実装
const MarkdownViewer = ({ content, className = "" }) => {
  const navigate = useNavigate();

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
    
    // 3. 見出しを処理（段落処理の前に）- 自動フォントサイズのみ
    
    // H6: +2pt (基本サイズ 16px + 2pt ≈ 19px)
    html = html.replace(/^#{6}\s+(.*$)/gm, (match, title) => {
      return `<h6 class="markdown-h6" style="font-size: 1.1875rem !important; font-weight: 600 !important; color: #64748b; margin: 1em 0 0.5em 0; line-height: 1.4;">${title}</h6>`;
    });
    
    // H5: +4pt (基本サイズ 16px + 4pt ≈ 21px)
    html = html.replace(/^#{5}\s+(.*$)/gm, (match, title) => {
      return `<h5 class="markdown-h5" style="font-size: 1.3125rem !important; font-weight: 650 !important; color: #64748b; margin: 1em 0 0.5em 0; line-height: 1.4;">${title}</h5>`;
    });
    
    // H4: +6pt (基本サイズ 16px + 6pt ≈ 24px)
    html = html.replace(/^#{4}\s+(.*$)/gm, (match, title) => {
      return `<h4 class="markdown-h4" style="font-size: 1.5rem !important; font-weight: 650 !important; color: #64748b; margin: 1.25em 0 0.75em 0; line-height: 1.4;">${title}</h4>`;
    });
    
    // H3: +8pt (基本サイズ 16px + 8pt ≈ 27px)
    html = html.replace(/^#{3}\s+(.*$)/gm, (match, title) => {
      return `<h3 class="markdown-h3" style="font-size: 1.6875rem !important; font-weight: 700 !important; color: #475569; margin: 1.5em 0 1em 0; line-height: 1.3;">${title}</h3>`;
    });
    
    // H2: +10pt (基本サイズ 16px + 10pt ≈ 30px)
    html = html.replace(/^#{2}\s+(.*$)/gm, (match, title) => {
      return `<h2 class="markdown-h2" style="font-size: 1.875rem !important; font-weight: 700 !important; color: #334155; margin: 2em 0 1.25em 0; padding-bottom: 0.3em; border-bottom: 2px solid #e2e8f0; line-height: 1.3;">${title}</h2>`;
    });
    
    // H1: +12pt (基本サイズ 16px + 12pt ≈ 32px)
    html = html.replace(/^#{1}\s+(.*$)/gm, (match, title) => {
      return `<h1 class="markdown-h1" style="font-size: 2rem !important; font-weight: 800 !important; color: #1e293b; margin: 2.5em 0 1.5em 0; padding-bottom: 0.5em; border-bottom: 3px solid #3b82f6; line-height: 1.2;">${title}</h1>`;
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
    // 改行の処理を改善
    const lines = html.split('\n');
    const processedLines = [];
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 空行の場合
      if (trimmedLine === '') {
        // 現在の段落がある場合は処理して追加
        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.join('<br>');
          // HTMLタグで始まっている場合は段落タグで囲まない
          if (paragraphText.match(/^<(h[1-6]|blockquote|ul|ol|hr|pre)/)) {
            processedLines.push(paragraphText);
          } else {
            processedLines.push(`<div class="markdown-content">${paragraphText}</div>`);
          }
          currentParagraph = [];
        }
        // 空の段落を追加（段落間のスペース）
        processedLines.push('<div class="markdown-content">&nbsp;</div>');
      } else {
        // HTMLタグで始まっている行の場合はそのまま追加
        if (trimmedLine.match(/^<(h[1-6]|blockquote|ul|ol|hr|pre)/)) {
          // 現在の段落がある場合は先に処理
          if (currentParagraph.length > 0) {
            const paragraphText = currentParagraph.join('<br>');
            processedLines.push(`<div class="markdown-content">${paragraphText}</div>`);
            currentParagraph = [];
          }
          processedLines.push(trimmedLine);
        } else {
          // 通常のテキスト行は現在の段落に追加
          currentParagraph.push(trimmedLine);
        }
      }
    }
    
    // 最後の段落を処理
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('<br>');
      if (paragraphText.match(/^<(h[1-6]|blockquote|ul|ol|hr|pre)/)) {
        processedLines.push(paragraphText);
      } else {
        processedLines.push(`<div class="markdown-content">${paragraphText}</div>`);
      }
    }
    
    html = processedLines.join('');
    
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

  // リンククリック時の処理
  const handleClick = (e) => {
    // リンククリック時の処理
    const linkElement = e.target.closest('.markdown-link');
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      
      // 外部リンクの場合はデフォルト動作を許可
      if (linkElement.classList.contains('external-link')) {
        return;
      }
      
      // 内部リンクの場合
      if (linkElement.classList.contains('internal-link')) {
        e.preventDefault();
        
        if (href.startsWith('/')) {
          navigate(href);
          return;
        }
        
        try {
          const currentPath = window.location.pathname;
          const resolvedPath = new URL(href, `${window.location.origin}${currentPath}`).pathname;
          navigate(resolvedPath);
        } catch (error) {
          console.warn('リンクの解決に失敗:', href, error);
        }
        return;
      }
      
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