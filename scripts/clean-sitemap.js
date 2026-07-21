const fs = require('hexo-fs');
const path = require('path');

// 注册 after_generate 过滤器，在所有文件生成后执行
hexo.extend.filter.register('after_generate', () => {
  const sitemapPath = path.join(hexo.public_dir, 'sitemap.xml');
  
  if (fs.existsSync(sitemapPath)) {
    let content = fs.readFileSync(sitemapPath, 'utf8');
    
    // 正则表达式：匹配并移除 <loc> 中域名后第一级目录为 tags 或 categories 的 <url> 节点
    // 这样可以避免误删 URL 中碰巧包含 tags 字样的文章（如 /2023/07/21/my-tags/）
    const regex = /<url>[\s\S]*?<loc>https?:\/\/[^/]+\/(tags|categories)\/[^<]*<\/loc>[\s\S]*?<\/url>/g;
    
    content = content.replace(regex, '');
    
    // 清理替换后可能产生的多余空行
    content = content.replace(/\n\s*\n/g, '\n');
    
    fs.writeFileSync(sitemapPath, content);
    hexo.log.info('Sitemap cleaned: tags and categories removed.');
  }
});