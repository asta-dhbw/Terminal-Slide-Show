// TODO Better detection of Raspberry Pi devices currently only checks user agent for common identifiers
export const isRaspberryPi = () => {
  if (typeof window === 'undefined') return false;

  // Check user agent for Raspberry Pi specific identifiers
  const userAgent = window.navigator.userAgent.toLowerCase();

  // Common identifiers for Raspberry Pi browsers
  return userAgent.includes('linux armv') || 
         userAgent.includes('raspbian') ||
         userAgent.includes('aarch64') ||
         userAgent.includes('arm64')
};