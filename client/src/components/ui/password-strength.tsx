import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className }) => {
  const calculateStrength = (password: string): StrengthResult => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    let label: string;
    let color: string;

    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = 'bg-red-500';
        break;
      case 2:
        label = 'Weak';
        color = 'bg-orange-500';
        break;
      case 3:
        label = 'Fair';
        color = 'bg-yellow-500';
        break;
      case 4:
        label = 'Good';
        color = 'bg-blue-500';
        break;
      case 5:
        label = 'Strong';
        color = 'bg-green-500';
        break;
      default:
        label = 'Very Weak';
        color = 'bg-red-500';
    }

    return { score, label, color, requirements };
  };

  if (!password) {
    return null;
  }

  const strength = calculateStrength(password);
  const progressWidth = (strength.score / 5) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 min-w-[80px]">
          {strength.label}
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">Password requirements:</div>
        <div className="grid grid-cols-1 gap-1">
          <RequirementItem 
            met={strength.requirements.length}
            text="At least 8 characters"
          />
          <RequirementItem 
            met={strength.requirements.lowercase}
            text="One lowercase letter"
          />
          <RequirementItem 
            met={strength.requirements.uppercase}
            text="One uppercase letter"
          />
          <RequirementItem 
            met={strength.requirements.number}
            text="One number"
          />
          <RequirementItem 
            met={strength.requirements.special}
            text="One special character"
          />
        </div>
      </div>
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <div className="flex items-center space-x-2 text-xs">
    <div className={cn(
      "w-3 h-3 rounded-full flex items-center justify-center",
      met ? "bg-green-500" : "bg-gray-300"
    )}>
      {met && (
        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <span className={cn(
      met ? "text-green-600" : "text-gray-500"
    )}>
      {text}
    </span>
  </div>
);

export default PasswordStrength;
