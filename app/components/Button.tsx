import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    children: React.ReactNode;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    ...rest
}) => {
    let variantClasses = '';

    switch (variant) {
        case 'primary':
            variantClasses = 'bg-primary text-white hover:bg-primary-dark shadow-sm';
            break;
        case 'secondary':
            variantClasses = 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50';
            break;
        case 'outline':
            variantClasses = 'bg-transparent text-primary border border-primary hover:bg-primary/5';
            break;
        case 'ghost':
            variantClasses = 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100';
            break;
    }

    return (
        <button
            className={`btn ${variantClasses} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
};

export default Button;
