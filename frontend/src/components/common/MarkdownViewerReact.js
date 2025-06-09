import React from 'react';

// React Markdownライブラリが利用可能な場合の実装
let ReactMarkdown, remarkGfm, Prism, oneDark;

try {
  ReactMarkdown = require('react-markdown').default;
  remarkGfm = require('remark-gfm').default;
  const SyntaxHighlighter = require('react-syntax-highlighter');
  Prism = SyntaxHighlighter.Prism;
  oneDark = require('react-syntax-highlighter/dist/esm/styles/prism/one-dark').default;
} catch (error) {
  console.warn('React Markdown libraries not available, falling back to simple parser');
}

const MarkdownViewerReact = ({ content, className = "" }) => {
  if (!content || !content.trim()) {
    return (
      <div className={`markdown-viewer empty-content ${className}`}>
        <p className="empty-message">内容がありません</p>
      </div>
    );
  }

  // React Markdownが利用可能な場合
  if (ReactMarkdown && remarkGfm) {
    return (
      <div className={`markdown-viewer ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ node, inline, className: codeClassName, children, ...props }) => {
              const match = /language-(\w+)/.exec(codeClassName || '');
              
              return !inline && match && Prism ? (
                <Prism
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: '1rem 0',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </Prism>
              ) : (
                <code className={`inline-code ${codeClassName || ''}`} {...props}>
                  {children}
                </code>
              );
            },
            h1: ({ children, ...props }) => (
              <h1 className="markdown-h1" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="markdown-h2" {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="markdown-h3" {...props}>{children}</h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 className="markdown-h4" {...props}>{children}</h4>
            ),
            h5: ({ children, ...props }) => (
              <h5 className="markdown-h5" {...props}>{children}</h5>
            ),
            h6: ({ children, ...props }) => (
              <h6 className="markdown-h6" {...props}>{children}</h6>
            ),
            p: ({ children, ...props }) => (
              <p className="markdown-paragraph" {...props}>{children}</p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="markdown-list" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="markdown-list ordered" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }) => (
              <li className="markdown-list-item" {...props}>{children}</li>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote className="markdown-blockquote" {...props}>{children}</blockquote>
            ),
            table: ({ children, ...props }) => (
              <div className="markdown-table-container">
                <table className="markdown-table" {...props}>{children}</table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className="markdown-th" {...props}>{children}</th>
            ),
            td: ({ children, ...props }) => (
              <td className="markdown-td" {...props}>{children}</td>
            ),
            a: ({ children, href, ...props }) => (
              <a 
                className="markdown-link" 
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            ),
            img: ({ src, alt, ...props }) => (
              <img 
                className="markdown-image" 
                src={src} 
                alt={alt}
                loading="lazy"
                {...props}
              />
            ),
            hr: ({ ...props }) => (
              <hr className="markdown-divider" {...props} />
            ),
            strong: ({ children, ...props }) => (
              <strong className="markdown-strong" {...props}>{children}</strong>
            ),
            em: ({ children, ...props }) => (
              <em className="markdown-em" {...props}>{children}</em>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // フォールバック: 簡易パーサー
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
    const paragraphs = html.split('\n\n').filter(p => p.trim());
    html = paragraphs.map(p => `<p class="markdown-paragraph">${p.replace(/\n/g, '<br>')}</p>`).join('');
    
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

export default MarkdownViewerReact;