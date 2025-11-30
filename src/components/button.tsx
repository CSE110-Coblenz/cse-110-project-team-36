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
            onClick={onClick}
            style = { props.className ? undefined : {...btnBase, ...additionalStyle} }
            {...props}
        >
            {children}
        </button>
    );
};

const btnBase: React.CSSProperties = {
    padding: '12px 20px',                       // slightly wider
    borderRadius: 16,
    border: '2px solid var(--color-white)',     // use global white
    fontWeight: 800,
    fontSize: '1rem',
    color: 'var(--color-black)',                // global black
    cursor: 'pointer',
    textShadow: '0 0 6px rgba(255, 255, 255, 0.6)', // subtle glow
    background: 'var(--btn-blue-gradient)',     // neon blue gradient
    boxShadow: 'var(--shadow-neon-blue)',       // neon glow shadow
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: 'var(--font-main)',
};
