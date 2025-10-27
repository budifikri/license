import React from 'react';
import Button from './ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, goToPage, nextPage, prevPage }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-2 w-full">
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={prevPage}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={nextPage}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
