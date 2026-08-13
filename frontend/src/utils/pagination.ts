export function buildPageWindow(currentPage: number, totalPages: number): (number | '...')[] {
  const window: (number | '...')[] = [];
  const maxVisible = 7;
  
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) window.push(i);
  } else {
    window.push(1);
    if (currentPage > 3) window.push('...');
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) window.push(i);
    
    if (currentPage < totalPages - 2) window.push('...');
    if (totalPages > 1) window.push(totalPages);
  }
  
  return window;
}
