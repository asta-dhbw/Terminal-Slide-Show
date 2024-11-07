// TODO Better detection of Raspberry Pi devices currently only checks user agent for common identifiers
export const isRaspberryPi = () => {
  if (typeof window === 'undefined') return false;

  // Check user agent for Raspberry Pi specific identifiers
  const userAgent = window.navigator.userAgent.toLowerCase();

  // Common identifiers for Raspberry Pi browsers
  return userAgent.includes('x86_64') ||
    userAgent.includes('raspbian')
};