interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => (
    <div style={{ display: 'grid', gap: 4 }}>
        {label && <label>{label}</label>}
        <input {...props} />
    </div>
);
