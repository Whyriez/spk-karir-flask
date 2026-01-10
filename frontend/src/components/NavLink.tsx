import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NavLink({
    active = false,
    className = '',
    children,
    to,
    ...props
}: any) {
    return (
        <Link
            {...props}
            to={to}
            className={
                'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out ' +
                (active
                    ? 'border-indigo-400 text-gray-900 focus:outline-none focus:border-indigo-700 '
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 ') +
                className
            }
        >
            {children}
        </Link>
    );
}