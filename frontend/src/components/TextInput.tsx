import React, { forwardRef, InputHTMLAttributes } from 'react';

export default forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function TextInput({ type = 'text', className = '', ...props }, ref) {
        return (
            <input
                {...props}
                type={type}
                className={
                    'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ' +
                    className
                }
                ref={ref}
            />
        );
    }
);