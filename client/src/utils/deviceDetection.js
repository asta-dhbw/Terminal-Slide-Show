/**
 * Detects if the current device is a Raspberry Pi
 * @returns {boolean} True if running on Raspberry Pi, false otherwise
 * 
 * Note: Detection is based on user agent strings which may not be 100% reliable
 * as they can be spoofed or modified
 */
export const isRaspberryPi = () => {
  // Skip detection if not running in browser environment
  if (typeof window === 'undefined') return false;

  // Get lowercase user agent string from browser
  const userAgent = window.navigator.userAgent.toLowerCase();

  // Check for Raspberry Pi indicators in user agent
  // x86_64: Common architecture for Pi 4
  // raspbian: Official Raspberry Pi OS
  return userAgent.includes('x86_64') ||
    userAgent.includes('raspbian');
};