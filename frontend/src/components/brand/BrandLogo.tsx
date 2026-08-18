interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  alt?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export function BrandLogo({ size = 'md', className = '', alt = 'Clario' }: BrandLogoProps) {
  return (
    <img
      src="/brand/clario-logo.png"
      alt={alt}
      className={`${sizeClasses[size]} shrink-0 rounded-[24%] object-cover ${className}`}
      draggable={false}
    />
  )
}
