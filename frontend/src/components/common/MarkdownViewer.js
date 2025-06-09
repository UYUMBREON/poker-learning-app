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
    
    // 見出し
    html = html.replace(/^### (.*$)/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="markdown-h1">$1</h1>');
    
    // 太字
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>');
    
    // 斜体
    html = html.replace(/\*(.*?)\*/g, '<em class="markdown-em">$1</em>');
    
    // インラインコード
    html = html.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
    
    // コードブロック
    html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${code}</code></pre>`;
    });
    
    // リンク
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // リスト
    html = html.replace(/^- (.*$)/gm, '<li class="markdown-list-item">$1</li>');
    html = html.replace(/(<li class="markdown-list-item">.*<\/li>)/s, '<ul class="markdown-list">$1</ul>');
    
    // 引用
    html = html.replace(/^> (.*$)/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');
    
    // 段落
    html = html.replace(/\n\n/g, '</p><p class="markdown-paragraph">');
    html = '<p class="markdown-paragraph">' + html + '</p>';
    
    // 空の段落を削除
    html = html.replace(/<p class="markdown-paragraph"><\/p>/g, '');
    
    // 改行
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div 
      className={`markdown-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownViewer;