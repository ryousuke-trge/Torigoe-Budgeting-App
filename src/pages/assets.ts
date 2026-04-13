import { api } from '../api';
import type { AssetEntry } from '../types';

export async function renderAssets(container: HTMLElement) {
  container.innerHTML = `
    <div class="flex items-center justify-center h-full">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
    </div>
  `;

  try {
    let assets = await api.getAssets();
    
    const render = () => {
      const totalAmount = (assets.bank || 0) + (assets.cashless || 0) + (assets.cash || 0);

      container.innerHTML = `
        <div class="p-4 bg-gray-50 min-h-full pb-24 relative">
          <h1 class="text-2xl font-bold text-gray-800 mb-6 px-2">資産管理</h1>
          
          <!-- 総資産額表示カード -->
          <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-white shadow-lg mb-8 transform transition-transform hover:scale-[1.02]">
            <div class="text-yellow-100 text-sm font-medium mb-1">現在の総資産</div>
            <div class="text-4xl font-bold tracking-tight">¥${totalAmount.toLocaleString()}</div>
          </div>

          <!-- 各項目リスト -->
          <div class="space-y-4">
            ${renderAssetCard('bank', '口座', '🏦', assets.bank)}
            ${renderAssetCard('cashless', 'キャッシュレス', '💳', assets.cashless)}
            ${renderAssetCard('cash', '現金', '💴', assets.cash)}
          </div>
        </div>

        <!-- 編集モーダルオーバーレイ -->
        <div id="edit-asset-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-[100] backdrop-blur-sm transition-opacity opacity-0 px-4">
          <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
            <h3 class="text-lg font-bold text-gray-800 mb-4" id="edit-modal-title">金額を編集</h3>
            <input type="number" id="edit-asset-input" class="w-full bg-gray-100 border-none rounded-xl p-4 text-xl font-bold text-gray-800 focus:ring-2 focus:ring-yellow-400 mb-6" placeholder="0">
            <input type="hidden" id="edit-asset-type">
            <div class="flex gap-3">
              <button id="btn-cancel-edit" class="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors">キャンセル</button>
              <button id="btn-save-edit" class="flex-1 py-3 px-4 bg-yellow-400 text-white font-bold rounded-xl shadow-md shadow-yellow-400/30 hover:bg-yellow-500 transition-colors">保存</button>
            </div>
          </div>
        </div>
      `;

      attachEventListeners();
    };

    const renderAssetCard = (type: string, name: string, icon: string, amount: number) => {
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
          <button data-edit-type="${type}" data-edit-name="${name}" data-edit-amount="${amount || 0}" class="edit-asset-btn p-3 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all active:scale-95">
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
      const btnCancel = document.getElementById('btn-cancel-edit');
      const btnSave = document.getElementById('btn-save-edit');

      const openModal = (type: string, name: string, amount: number) => {
        if (!modal || !titleEl || !inputEl || !typeEl) return;
        titleEl.textContent = `${name}の金額を編集`;
        inputEl.value = amount.toString();
        typeEl.value = type;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // トリガーリフロー (CSSアニメーション用)
        void modal.offsetWidth;
        
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
          const type = target.getAttribute('data-edit-type') || '';
          const name = target.getAttribute('data-edit-name') || '';
          const amount = parseInt(target.getAttribute('data-edit-amount') || '0', 10);
          openModal(type, name, amount);
        });
      });

      btnCancel?.addEventListener('click', closeModal);
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      btnSave?.addEventListener('click', async () => {
        if (!inputEl || !typeEl || !btnSave) return;
        
        const newValue = parseInt(inputEl.value || '0', 10);
        const type = typeEl.value as keyof Pick<AssetEntry, 'bank'|'cashless'|'cash'>;
        
        const originalText = btnSave.textContent;
        btnSave.textContent = '保存中...';
        btnSave.setAttribute('disabled', 'true');
        btnSave.classList.add('opacity-50', 'cursor-not-allowed');

        try {
          const updates = { [type]: newValue };
          assets = await api.updateAssets(assets.id, updates);
          closeModal();
          setTimeout(render, 300); // モーダルが閉じてから再描画
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
