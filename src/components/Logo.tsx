import { MessageSquare } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function Logo({ 
  className = "", 
  iconClassName = "h-8 w-8",
  textClassName = "text-xl",
  showText = true,
  onClick,
  clickable = false
}: LogoProps) {
  const content = (
    <>
      <MessageSquare className={`${iconClassName} text-primary`} />
      {showText && (
        <span className={`font-semibold ${textClassName}`}>
          Orrico
        </span>
      )}
    </>
  );

  if (clickable || onClick) {
    return (
      <div 
        className={`flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
        onClick={onClick}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {content}
    </div>
  );
}
