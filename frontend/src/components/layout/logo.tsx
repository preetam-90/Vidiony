import Link from "next/link";

interface LogoProps {
  variant?: "full" | "icon" | "icon-text";
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: { container: "h-7 w-7", text: "text-sm" },
  md: { container: "h-9 w-9", text: "text-lg" },
  lg: { container: "h-12 w-12", text: "text-2xl" },
};

export function Logo({ 
  variant = "full", 
  size = "md", 
  className = "",
  showText = true 
}: LogoProps) {
  const sizes = sizeClasses[size];
  
  if (variant === "icon") {
    return (
      <Link href="/" className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizes.container} flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600`}>
          <svg viewBox="0 0 40 40" className="h-full w-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M8 28 L20 10 L32 28" 
              stroke="white" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes.container} flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 transition-transform hover:scale-105`}>
        <svg viewBox="0 0 40 40" className="h-full w-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M10 30V10L20 22L30 10V30" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={`${sizes.text} font-bold tracking-tight`}>
          Vidiony
        </span>
      )}
    </Link>
  );
}

export function LogoIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg", className?: string }) {
  const sizes = sizeClasses[size];
  
  return (
    <div className={`${sizes.container} flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-full w-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M10 30V10L20 22L30 10V30" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
