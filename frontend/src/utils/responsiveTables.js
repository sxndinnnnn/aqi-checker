export function makeTablesResponsive(root) {
  if (!root) return;
  root.querySelectorAll('table').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        if (headers[i]) td.setAttribute('data-label', headers[i]);
      });
    });
    if (!table.parentElement.classList.contains('table-scroll')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentElement.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
}
