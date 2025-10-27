
import React from 'react';

// Fix: Updated Table component to accept standard HTML table attributes.
const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={`w-full caption-bottom text-sm ${className || ''}`}
      {...props}
    />
  </div>
);

// Fix: Updated TableHeader component to accept standard HTML thead attributes.
const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={`[&_tr]:border-b ${className || ''}`} {...props} />
);

// Fix: Updated TableBody component to accept standard HTML tbody attributes.
const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className || ''}`} {...props} />
);

// Fix: Updated TableFooter component to accept standard HTML tfoot attributes.
const TableFooter: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tfoot className={`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className || ''}`} {...props} />
);

// Fix: Updated TableRow component to accept standard HTML tr attributes.
const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`} {...props} />
);

// Fix: Updated TableHead component to accept standard HTML th attributes.
const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({ className, ...props }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`} {...props} />
);

// Fix: Updated TableCell component to accept standard HTML td attributes like colSpan.
const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`} {...props} />
);

// Fix: Updated TableCaption component to accept standard HTML caption attributes.
const TableCaption: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <caption className={`mt-4 text-sm text-muted-foreground ${className || ''}`} {...props} />
);

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption };
