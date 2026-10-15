import {searchCatalog} from './catalog-api.mjs';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

export function createHandler(assets) {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === '/api/books') {
        if (request.method !== 'GET') return new Response('Method not allowed', {status: 405});
        try {
          const books = await searchCatalog(url.searchParams.get('q'));
          return Response.json({books}, {headers: {'Cache-Control': 'public, max-age=60'}});
        } catch (error) {
          const invalid = String(error.message).includes('2~80');
          return Response.json({error: error.message}, {status: invalid ? 400 : 502});
        }
      }
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const asset = assets[path];
      if (!asset) return new Response('Not found', {status: 404});
      const ext = path.slice(path.lastIndexOf('.'));
      const headers = {'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream', 'Cache-Control': path === '/index.html' ? 'no-cache' : 'public, max-age=3600'};
      return new Response(asset.binary ? Uint8Array.from(atob(asset.body), char => char.charCodeAt(0)) : asset.body, {headers});
    }
  };
}
