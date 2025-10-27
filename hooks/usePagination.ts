import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
}

export const usePagination = <T>({ data, itemsPerPage = 10 }: UsePaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    // Reset to page 1 if current page is out of bounds (e.g., due to filtering)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage, totalPages]);

  const goToPage = (pageNumber: number) => {
    const newPage = Math.max(1, Math.min(pageNumber, totalPages > 0 ? totalPages : 1));
    setCurrentPage(newPage);
  };

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  // Effect to reset page when data changes significantly
  useState(() => {
      setCurrentPage(1);
  });


  return {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  };
};
