import './style.css';
import { initCategoriesIfEmpty } from './seed';
import { renderHome } from './pages/home';
import { renderStats } from './pages/stats';
import { renderSettings } from './pages/settings';
import { renderBottomNav } from './components/BottomNav';

// DOM Elements
const pageContent = document.getElementById('page-content');
const bottomNav = document.getElementById('bottom-nav');

function handleRoute() {
  if (!pageContent || !bottomNav) return;

  const hash = window.location.hash;

  // ナビゲーションの再描画
  renderBottomNav(bottomNav, hash);

  // コンテンツの再描画
  pageContent.innerHTML = '';
  switch (hash) {
    case '#/stats':
      renderStats(pageContent);
      break;
    case '#/settings':
      renderSettings(pageContent);
      break;
    case '':
    case '#/':
    default:
      renderHome(pageContent);
      break;
  }
}

async function init() {
  // DBの初期カテゴリ投入
  await initCategoriesIfEmpty();

  // ルーティングの初期化
  window.addEventListener('hashchange', handleRoute);
  
  // 初期ロード時のルート解決
  handleRoute();
}

init();
