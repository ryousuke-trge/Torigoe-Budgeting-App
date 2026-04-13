import { api } from '../api';
import { supabase } from '../supabase';
import type { AssetEntry } from '../types';

export async function renderAssets(container: HTMLElement) {
  container.innerHTML = `
    <div class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
    </div>
  `;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserEmail = sessionData.session?.user?.email;

    let [allAssets, profiles] = await Promise.all([
      api.getAllAssets(),
      api.getProfiles()
    ]);

    // Check if logged in user has an asset, if not add it to allow insertion
    if (currentUserEmail && !allAssets.some(a => a.author_name === currentUserEmail)) {
        allAssets.push({ id: '', bank: 0, cashless: 0, cash: 0, author_name: currentUserEmail });
    }

    const render = () => {
      let html = `<div class="p-4 bg-gray-50 min-h-full pb-24 relative">`;
      html += `<h1 class="text-2xl font-bold text-gray-800 mb-6 px-2">資産管理</h1>`;

      allAssets.forEach(asset => {
        const profile = profiles.find(p => p.email === asset.author_name);
        // Display email prefix if profile display_name is not set.
        let defaultName = asset.author_name ? asset.author_name.split('@')[0] : 'ゲスト';
        const displayName = profile?.display_name || defaultName;
        const userTitle = `${displayName}の資産`;
        const totalAmount = (asset.bank || 0) + (asset.cashless || 0) + (asset.cash || 0);

        html += `
          <div class="mb-8">
            <h2 class="text-xl font-bold text-gray-700 mb-4 px-2 w-full border-b border-gray-200 pb-2">${userTitle}</h2>
            <!-- 総資産額表示カード -->
            <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-white shadow-lg mb-4 transform transition-transform hover:scale-[1.02]">
              <div class="text-yellow-100 text-sm font-medium mb-1">現在の総資産</div>
              <div class="text-4xl font-bold tracking-tight">¥${totalAmount.toLocaleString()}</div>
            </div>

            <!-- 各項目リスト -->
            <div class="space-y-4">
              ${renderAssetCard(asset.id || '', 'bank', '口座', '🏦', asset.bank, asset.author_name)}
              ${renderAssetCard(asset.id || '', 'cashless', 'キャッシュレス', '💳', asset.cashless, asset.author_name)}
              ${renderAssetCard(asset.id || '', 'cash', '現金', '💴', asset.cash, asset.author_name)}
            </div>
          </div>
        `;
      });

      html += `</div>`;

      // 編集モーダルオーバーレイ
      html += `
        <div id="edit-asset-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-[100] backdrop-blur-sm transition-opacity opacity-0 px-4">
          <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
            <h3 class="text-lg font-bold text-gray-800 mb-4" id="edit-modal-title">金額を編集</h3>
            <input type="number" id="edit-asset-input" class="w-full bg-gray-100 border-none rounded-xl p-4 text-xl font-bold text-gray-800 focus:ring-2 focus:ring-yellow-400 mb-6" placeholder="0">
            <input type="hidden" id="edit-asset-type">
            <input type="hidden" id="edit-asset-id">
            <input type="hidden" id="edit-asset-author">
            <div class="flex gap-3">
              <button id="btn-cancel-edit" class="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors">キャンセル</button>
              <button id="btn-save-edit" class="flex-1 py-3 px-4 bg-yellow-400 text-white font-bold rounded-xl shadow-md shadow-yellow-400/30 hover:bg-yellow-500 transition-colors">保存</button>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
      attachEventListeners();
    };

    const renderAssetCard = (id: string, type: string, name: string, icon: string, amount: number, authorName: string = '') => {
      return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl shadow-inner">
              ${icon}
            </div>
            <div>
              <div class="text-sm text-gray-500 font-medium">${name}</div>
              <div class="text-xl font-bold text-gray-800">¥${(amount || 0).toLocaleString()}</div>
            </div>
          </div>
          <button data-edit-id="${id}" data-edit-type="${type}" data-edit-name="${name}" data-edit-amount="${amount || 0}" data-edit-author="${authorName}" class="edit-asset-btn p-3 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
        </div>
      `;
    };

    const attachEventListeners = () => {
      const modal = document.getElementById('edit-asset-modal');
      const titleEl = document.getElementById('edit-modal-title');
      const inputEl = document.getElementById('edit-asset-input') as HTMLInputElement;
      const typeEl = document.getElementById('edit-asset-type') as HTMLInputElement;
      const idEl = document.getElementById('edit-asset-id') as HTMLInputElement;
      const authorEl = document.getElementById('edit-asset-author') as HTMLInputElement;
      const btnCancel = document.getElementById('btn-cancel-edit');
      const btnSave = document.getElementById('btn-save-edit');

      const openModal = (id: string, type: string, name: string, amount: number, authorName: string) => {
        if (!modal || !titleEl || !inputEl || !typeEl || !idEl || !authorEl) return;
        titleEl.textContent = `${name}の金額を編集`;
        inputEl.value = amount.toString();
        typeEl.value = type;
        idEl.value = id;
        authorEl.value = authorName;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        void modal.offsetWidth; // trigger reflow
        
        modal.classList.remove('opacity-0');
        modal.firstElementChild?.classList.remove('scale-95');
        
        setTimeout(() => inputEl.focus(), 50);
      };

      const closeModal = () => {
        if (!modal) return;
        modal.classList.add('opacity-0');
        modal.firstElementChild?.classList.add('scale-95');
        
        setTimeout(() => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }, 300);
      };

      document.querySelectorAll('.edit-asset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          const id = target.getAttribute('data-edit-id') || '';
          const type = target.getAttribute('data-edit-type') || '';
          const name = target.getAttribute('data-edit-name') || '';
          const author = target.getAttribute('data-edit-author') || '';
          const amount = parseInt(target.getAttribute('data-edit-amount') || '0', 10);
          openModal(id, type, name, amount, author);
        });
      });

      btnCancel?.addEventListener('click', closeModal);
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      btnSave?.addEventListener('click', async () => {
        if (!inputEl || !typeEl || !btnSave || !idEl || !authorEl) return;
        
        const newValue = parseInt(inputEl.value || '0', 10);
        const type = typeEl.value as keyof Pick<AssetEntry, 'bank'|'cashless'|'cash'>;
        const targetId = idEl.value;
        const targetAuthor = authorEl.value;
        
        const originalText = btnSave.textContent;
        btnSave.textContent = '保存中...';
        btnSave.setAttribute('disabled', 'true');
        btnSave.classList.add('opacity-50', 'cursor-not-allowed');

        try {
          const updates: any = { [type]: newValue };
          if (!targetId && targetAuthor) {
            updates.author_name = targetAuthor; // If creating new, specify whose it is
          }

          const updatedAsset = await api.updateAssets(targetId, updates);
          
          // Update the localized array
          const idx = allAssets.findIndex(a => targetId ? a.id === targetId : a.author_name === targetAuthor);
          if (idx >= 0) {
            allAssets[idx] = updatedAsset;
          }
          
          closeModal();
          setTimeout(render, 300); // 閉じた後に再描画
        } catch (err) {
          console.error(err);
          alert('保存に失敗しました');
        } finally {
          btnSave.textContent = originalText;
          btnSave.removeAttribute('disabled');
          btnSave.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });
    };

    render();

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="p-8 text-center bg-gray-50 h-full flex flex-col justify-center">
        <div class="text-4xl mb-4">😢</div>
        <div class="text-red-500 font-bold mb-2">データの読み込みに失敗しました。</div>
        <div class="text-sm text-gray-500">ネットワーク接続を確認するか、リロードしてください。</div>
      </div>
    `;
  }
}
