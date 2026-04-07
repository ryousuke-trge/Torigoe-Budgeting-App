import type { Category } from '../types';
import { formatDate } from '../utils/date';

export function createTransactionModal(
  categories: Category[],
  onSubmit: (data: { date: string; amount: number; category_id: string; memo: string }) => Promise<void>
) {
  // すでにモーダルがあれば削除
  const existingModal = document.getElementById('transaction-modal');
  if (existingModal) existingModal.remove();

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const modalHtml = `
    <div id="transaction-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm opacity-0 transition-opacity duration-300">
      <div class="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl transform translate-y-full sm:translate-y-0 transition-transform duration-300">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-800">収支を追加</h2>
          <button id="modal-close-btn" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form id="transaction-form" class="flex flex-col gap-4">
          <!-- タイプ選択 -->
          <div class="flex bg-gray-100 rounded-lg p-1">
            <label class="flex-1 text-center cursor-pointer">
              <input type="radio" name="type" value="expense" class="peer sr-only" checked />
              <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-red-500 transition-all">支出</div>
            </label>
            <label class="flex-1 text-center cursor-pointer">
              <input type="radio" name="type" value="income" class="peer sr-only" />
              <div class="py-2 rounded-md peer-checked:bg-white peer-checked:shadow text-sm font-medium text-gray-600 peer-checked:text-blue-500 transition-all">収入</div>
            </label>
          </div>

          <!-- 日付 -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">日付</label>
            <input type="date" id="tx-date" name="date" required value="${formatDate(new Date())}" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- 金額 -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">金額 (円)</label>
            <input type="number" id="tx-amount" name="amount" required min="1" placeholder="0" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- カテゴリ -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">カテゴリ</label>
            <select id="tx-category" name="category_id" required class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pb-2">
              <optgroup label="支出" id="optgroup-expense">
                ${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </optgroup>
              <optgroup label="収入" id="optgroup-income" style="display: none;">
                ${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
              </optgroup>
            </select>
          </div>

          <!-- メモ -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">メモ</label>
            <input type="text" id="tx-memo" name="memo" placeholder="任意" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">
            保存する
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('transaction-modal')!;
  const inner = modal.firstElementChild!;
  const form = document.getElementById('transaction-form') as HTMLFormElement;
  const closeBtn = document.getElementById('modal-close-btn')!;
  
  const typeRadios = form.querySelectorAll<HTMLInputElement>('input[name="type"]');
  const catSelect = document.getElementById('tx-category') as HTMLSelectElement;
  const optExp = document.getElementById('optgroup-expense')!;
  const optInc = document.getElementById('optgroup-income')!;

  // アニメーション表示
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    inner.classList.remove('translate-y-full');
  });

  const closeModal = () => {
    modal.classList.add('opacity-0');
    inner.classList.add('translate-y-full');
    setTimeout(() => modal.remove(), 300); // アニメーション終了後に削除
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // タイプ切り替えでカテゴリ絞り込み
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (val === 'income') {
        optExp.style.display = 'none';
        optInc.style.display = '';
        // 最初の収入カテゴリを選択
        if (incomeCategories.length > 0) catSelect.value = incomeCategories[0].id;
      } else {
        optExp.style.display = '';
        optInc.style.display = 'none';
        if (expenseCategories.length > 0) catSelect.value = expenseCategories[0].id;
      }
    });
  });

  // サブミット処理
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const date = data.get('date') as string;
    const amountStr = data.get('amount') as string;
    const category_id = data.get('category_id') as string;
    const memo = (data.get('memo') as string) || '';

    const amount = Number(amountStr);
    if (!date || !amount || !category_id) return;

    try {
      // 送信ボタンをローディング状態にするなど適宜
      await onSubmit({ date, amount, category_id, memo });
      closeModal();
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
  });
}
