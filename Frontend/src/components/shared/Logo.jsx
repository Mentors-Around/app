import React from 'react';
import lightLogo from '../../assets/logos/light.png';
import darkLogo from '../../assets/logos/dark.png';

const Logo = ({ variant = 'light', className = 'h-10 w-auto', ...props }) => {
  const logoSrc = variant === 'dark' ? darkLogo : lightLogo;
  return (
    <img
      src={logoSrc}
      alt="TrueEd Logo"
      className={className}
      {...props}
    />
  );
};

export default Logo;
