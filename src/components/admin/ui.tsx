import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Primitivas visuais do admin (backstage da marca): um lugar único pros padrões
 * de botão/card/badge/input/cabeçalho que hoje estão copiados com pequenas
 * inconsistências pelos componentes existentes. Fase 0 só introduz as
 * primitivas; a migração das páginas acontece nas fases seguintes.
 *
 * Motion: só feedback de estado (press, foco), sob 200ms, sem bounce/elastic,
 * desligado em prefers-reduced-motion via variante motion-reduce do Tailwind.
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ambar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-noite";

// ---------- Button ----------

const BUTTON_BASE =
  `inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold px-3.5 py-2 ` +
  `transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ` +
  `disabled:opacity-40 disabled:pointer-events-none ${FOCUS_RING}`;

const BUTTON_VARIANTS = {
  primary: "bg-ambar text-breu hover:opacity-90",
  secondary: "border border-areia/20 text-areia/80 hover:border-areia/40 hover:text-areia",
  ghost: "text-areia/60 hover:text-areia hover:bg-areia/5",
  destructive: "bg-brasa text-areia hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", className = "", ...props },
  ref
) {
  return <button ref={ref} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />;
});

// ---------- Card ----------

const CARD_PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof CARD_PADDING;
  /** Card clicável (ex: linca pro detalhe): cursor + hover de borda. */
  interactive?: boolean;
}

export function Card({ padding = "md", interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-areia/10 bg-breu/60 ${CARD_PADDING[padding]} ${
        interactive ? "cursor-pointer transition-colors duration-150 hover:border-areia/20" : ""
      } ${className}`}
      {...props}
    />
  );
}

// ---------- Badge ----------

const BADGE_TONES = {
  /** Informação neutra (formato, categoria). */
  neutral: "bg-areia/10 text-areia/70",
  /** Ação e destaque (o âmbar volta a significar só isso). */
  ambar: "bg-ambar/15 text-ambar",
  /** Contexto secundário (status, metadado editorial). */
  dourado: "bg-dourado/15 text-dourado",
  /** Alerta/erro/destrutivo/atrasado. Nunca âmbar pra isso. */
  brasa: "bg-brasa/15 text-brasa",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs uppercase tracking-wide rounded-full px-2.5 py-1 ${BADGE_TONES[tone]} ${className}`}
      {...props}
    />
  );
}

// ---------- Input / Textarea / Select ----------

const FIELD_BASE =
  "w-full rounded-lg bg-noite border px-3 py-2 text-sm text-areia outline-none transition-colors duration-150 " +
  "placeholder:text-areia/30 disabled:opacity-40";

function fieldTone(error?: boolean) {
  return error ? "border-brasa/60 focus:border-brasa" : "border-areia/15 focus:border-ambar";
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, className = "", ...props },
  ref
) {
  return <input ref={ref} className={`${FIELD_BASE} ${fieldTone(error)} ${className}`} {...props} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = "", ...props },
  ref
) {
  return <textarea ref={ref} className={`${FIELD_BASE} ${fieldTone(error)} ${className}`} {...props} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, className = "", children, ...props },
  ref
) {
  return (
    <select ref={ref} className={`${FIELD_BASE} ${fieldTone(error)} ${className}`} {...props}>
      {children}
    </select>
  );
});

// ---------- SectionHeader ----------

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">{eyebrow}</p>
        <h1 className="display text-3xl text-areia">{title}</h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ---------- EmptyState ----------

export interface EmptyStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-areia/15 px-5 py-8 text-center">
      {title && <p className="text-sm text-areia/70 font-semibold mb-1">{title}</p>}
      <p className="text-sm text-areia/40 italic">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
