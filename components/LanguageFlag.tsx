import type { SupportedLanguage } from '@/types';

export const LANGUAGE_COUNTRY_CODE: Record<SupportedLanguage, string> = {
  fr: 'fr',
  en: 'gb',
};

const SIZE_CLASS = {
  xs: 'h-3 w-auto rounded-[1px]',
  sm: 'h-3.5 w-auto rounded-[2px]',
  md: 'h-4 w-auto rounded-[2px]',
  lg: 'h-5 w-auto rounded-[3px]',
  xl: 'h-7 w-auto rounded-[3px]',
  '2xl': 'h-8 w-auto rounded-[4px]',
} as const;

type FlagSize = keyof typeof SIZE_CLASS;

type CountryFlagProps = {
  countryCode: string;
  size?: FlagSize;
  className?: string;
  alt: string;
};

export function CountryFlag({
  countryCode,
  size = 'md',
  className = '',
  alt,
}: CountryFlagProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      alt={alt}
      className={`inline-block shrink-0 object-cover ${SIZE_CLASS[size]} ${className}`}
    />
  );
}

type LanguageFlagProps = {
  language: SupportedLanguage;
  size?: FlagSize;
  className?: string;
  alt?: string;
};

export function LanguageFlag({
  language,
  size = 'md',
  className = '',
  alt,
}: LanguageFlagProps) {
  const countryCode = LANGUAGE_COUNTRY_CODE[language];

  return (
    <CountryFlag
      countryCode={countryCode}
      size={size}
      className={className}
      alt={alt ?? (language === 'fr' ? 'Bandeira da França' : 'Bandeira do Reino Unido')}
    />
  );
}

type BrazilFlagProps = {
  size?: FlagSize;
  className?: string;
  alt?: string;
};

export function BrazilFlag({
  size = 'md',
  className = '',
  alt = 'Bandeira do Brasil',
}: BrazilFlagProps) {
  return <CountryFlag countryCode="br" size={size} className={className} alt={alt} />;
}
