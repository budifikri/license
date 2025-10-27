
import React from 'react';

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props} />
);

export default Label;
