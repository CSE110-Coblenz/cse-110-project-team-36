import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    additionalStyle?: React.CSSProperties; // additional styles for base button. Can be used to change colors, size etc.
    onClick: (e: React.FormEvent) => void; // click handler
    children?: React.ReactNode; // button text or elements
}

export const Button: React.FC<ButtonProps> = ({
    additionalStyle,
    onClick,
    children,
    ...props
}) => {
    return (
        <button
            style={{ ...btnBase, ...additionalStyle }}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 16,
    border: '2px solid #fff',
    fontWeight: 800,
    fontSize: '1rem',
    color: '#000',
    cursor: 'pointer',
    textShadow: '0 0 4px rgba(255,255,255,0.6)',
    transition: 'transform 0.12s ease',
    WebkitTapHighlightColor: 'transparent',
};
