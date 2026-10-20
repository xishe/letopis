import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import Kbd from './Kbd';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  kbd?: string;
}

const variants: Record<ButtonProps['variant'], string> = {
  primary:
    'bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(27,28,31,0.12)] hover:bg-accent-hover disabled:bg-accent/40 disabled:shadow-none',
  secondary:
    'border border-border bg-surface text-ink shadow-[0_1px_1px_rgba(27,28,31,0.04)] hover:bg-bg hover:border-ink-3/40 disabled:text-ink-3 disabled:hover:bg-surface disabled:hover:border-border',
  ghost: 'text-ink-2 hover:bg-ink/5 hover:text-ink disabled:text-ink-3 disabled:hover:bg-transparent',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-sm',
  md: 'h-8 gap-2 px-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = 'md', kbd, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
      {kbd && (
        <Kbd
          className={cx(
            'ml-0.5',
            variant === 'primary' && 'border-white/25 bg-white/15 text-white',
          )}
        >
          {kbd}
        </Kbd>
      )}
    </button>
  );
});

export default Button;
export { Button };
