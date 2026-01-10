import React, { useState, createContext, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom';

const DropDownContext = createContext<any>(null);

const Dropdown = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen((prev) => !prev);

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggle }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }: { children: React.ReactNode }) => {
    const { toggle } = useContext(DropDownContext);
    return (
        <div onClick={toggle} className="cursor-pointer">
            {children}
        </div>
    );
};

const Content = ({ children, width = '48' }: { children: React.ReactNode, width?: string }) => {
    const { open, setOpen } = useContext(DropDownContext);

    // Close on click outside logic could be added here

    if (!open) return null;

    return (
        <div
            className={`absolute right-0 z-50 mt-2 w-${width} rounded-md shadow-lg origin-top-right bg-white ring-1 ring-black ring-opacity-5 py-1`}
            onClick={() => setOpen(false)}
        >
            {children}
        </div>
    );
};

const DropdownLink = ({ className = '', children, ...props }: any) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;