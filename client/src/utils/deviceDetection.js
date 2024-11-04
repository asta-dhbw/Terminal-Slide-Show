export const isRaspberryPi = () => {
  if (typeof window === 'undefined') return false;

  // Check user agent for Raspberry Pi specific identifiers
  const userAgent = window.navigator.userAgent.toLowerCase();
  console.log(userAgent);
  // Common identifiers for Raspberry Pi browsers
  return userAgent.includes('linux armv') || 
         userAgent.includes('raspbian') ||
         userAgent.includes('arm64')
};