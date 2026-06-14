import Image from 'next/image';

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

export function Logo({
  size = 32,
  className = 'object-cover w-full h-full',
  priority = false,
  alt = 'Verbalize',
}: LogoProps) {
  return (
    <Image
      src="/logo.webp"
      alt={alt}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={className}
      priority={priority}
    />
  );
}
